import os
import pytest
os.environ['TALENT_CHECK_SOURCE_MODE']='csv'
from talent_check.scoring import score_profile,_required_level
from talent_check.repository import load_company_levels,load_skill_topics,clear_cache

def setup_function(): clear_cache()
def test_local_sources_and_rubric_coverage():
 assert len(load_skill_topics())==120
 assert len(load_company_levels())>0
def test_empty_profile_contract():
 r=score_profile({},'Google LLC (Subsidiary of Alphabet Inc.)')
 assert len(r['skillset_gap'])==12 and r['readiness_score']==0
 assert all(x['candidate_level']==1 for x in r['skillset_gap'])
def test_exact_company_only():
 try:score_profile({},'Google')
 except ValueError as e:assert 'exact canonical name' in str(e)
 else:assert False

def test_benchmark_parser_rejects_invalid():
 assert _required_level('8-CR')==8 and _required_level('10-AS')==10
 try:_required_level('unknown')
 except ValueError:pass
 else:assert False

def test_evidence_distinguishes_sparse_and_applied():
 a=score_profile({'skills':[{'skill_name':'Python','category_code':'COD','evidence':'Python'}]},'Google LLC (Subsidiary of Alphabet Inc.)')
 b=score_profile({'skills':[{'skill_name':'Python','category_code':'COD','evidence':'Built and implemented Python functions, loops, error handling, debugging, arrays, strings, recursion, object-oriented programming, classes and objects, file handling, libraries and APIs'}],'projects':['Developed and shipped a Python application with tests and modular design']},'Google LLC (Subsidiary of Alphabet Inc.)')
 assert b['skillset_gap'][0]['candidate_level']>a['skillset_gap'][0]['candidate_level']

def test_gap_and_score_consistent():
 r=score_profile({'skills':['SQL','Python']},'Oracle India Private Limited')
 assert 0<=r['readiness_score']<=100
 assert all(x['gap']==(x['candidate_level']<x['required_level']) for x in r['skillset_gap'])

def test_module3_adapter_shape():
 from talent_check.profile_adapter import adapt_profile
 p=adapt_profile({'company':'x','profile':{'technical_skills':['Python'],'project_details':['Built app']}})
 assert p['skills']==['Python'] and p['projects']==['Built app']

def test_real_sample_resume_texts_produce_valid_results():
 from pathlib import Path
 root=Path(__file__).resolve().parents[1]/'examples'
 company='Google LLC (Subsidiary of Alphabet Inc.)'
 results=[]
 for name in ('Ananya Rao.txt','Karthik Subramaniam.txt','Priya Menon.txt','Rohan Verma.txt'):
  text=(root/name).read_text(encoding='utf-8')
  # Preserve each actual resume's content as profile evidence instead of inventing parsed skills.
  result=score_profile({'name':name.removesuffix('.txt'),'summary':text,'projects':[text]},company)
  assert len(result['skillset_gap'])==12
  assert 0<=result['readiness_score']<=100
  results.append(result['readiness_score'])
 assert len(set(results))>=2


def test_duplicate_company_benchmark_is_rejected_for_that_company(monkeypatch):
    import pandas as pd
    import talent_check.scoring as scoring

    # Use the actual local benchmark data as the starting point.
    companies = scoring.load_company_levels().copy()

    # Simulate a duplicate so the test remains valid even after
    # the real Supabase duplicate has been fixed.
    target = companies[
        companies["companies"].str.strip().str.casefold()
        == "zs associates, inc."
    ]

    if target.empty:
        pytest.skip(
            "ZS Associates benchmark is not present in the test dataset."
        )

    duplicate = target.iloc[[0]].copy()
    duplicate["id"] = -999999
    companies = pd.concat(
        [companies, duplicate], ignore_index=True
    )

    monkeypatch.setattr(
        scoring, "load_company_levels", lambda: companies
    )

    try:
        scoring.score_profile({}, "ZS Associates, Inc.")
    except ValueError as exc:
        assert "Duplicate exact company benchmark" in str(exc)
    else:
        pytest.fail("Duplicate company benchmark was not rejected.")

