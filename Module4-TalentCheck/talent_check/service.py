"""Application service; explanations are separate to preserve Module 3's exact JSON contract."""
from .scoring import score_profile,BENCHMARK_COLUMNS
from .repository import load_company_levels
from .profile_adapter import adapt_profile

def run_talent_check(payload):
    if not isinstance(payload,dict): raise ValueError('Request body must be a JSON object.')
    company=payload.get('company')
    if not isinstance(company,str) or not company.strip(): raise ValueError('company is required.')
    profile=adapt_profile(payload)
    result=score_profile(profile,company)
    levels={x['category_code']:x for x in result['skillset_gap']}
    strengths=[x['category_code'] for x in result['skillset_gap'] if not x['gap']]
    gaps=[x['category_code'] for x in result['skillset_gap'] if x['gap']]
    result['explanation']={
      'summary': f"{profile.get('name') or 'The candidate'} meets the benchmark in {len(strengths)} of 12 skill categories for {result['company']}; {len(gaps)} categories show a gap.",
      'strengths': strengths,
      'priority_gaps': sorted(gaps,key=lambda c: levels[c]['required_level']-levels[c]['candidate_level'],reverse=True)[:3],
      'recommendations': [f"Build and document a project demonstrating {c} at level {levels[c]['required_level']}. Current evidence supports level {levels[c]['candidate_level']}." for c in sorted(gaps,key=lambda c: levels[c]['required_level']-levels[c]['candidate_level'],reverse=True)[:3]]
    }
    return result
