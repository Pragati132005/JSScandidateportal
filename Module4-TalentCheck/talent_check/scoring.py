import re
from .schemas import CATEGORIES,CATEGORY_ALIASES
from .repository import load_skill_topics,load_company_levels
from .level_estimator import estimate_level,flatten,norm
from .rubric import validate_rubric,validate_benchmarks
BENCHMARK_COLUMNS={'COD':'coding','DSA':'data_structures_and_algorithms','OOD':'object_oriented_programming_and_design','APTI':'aptitude_and_problem_solving','COMM':'communication_skills','AI':'ai_native_engineering','CLOUD':'devops_and_cloud','SQL':'sql_and_design','SWE':'software_engineering','SYSD':'system_design_and_architecture','NETW':'computer_networking','OS':'operating_system'}
def _category(v):
 s=str(v or '').strip()
 if s.upper() in CATEGORIES:return s.upper()
 return CATEGORY_ALIASES.get(norm(s),'OTHER')
def _find_company(company,rows):
 target=norm(company)
 if not target: raise ValueError('company must not be blank.')
 names=rows.companies.astype(str)
 exact=rows[names.map(norm)==target]
 if len(exact)==1:return exact.iloc[0]
 # Strict selection: no fuzzy/substring match that could pick the wrong benchmark.
 if len(exact)>1:raise ValueError(f'Duplicate exact company benchmark for {company!r}. Fix source data.')
 available=sorted(names.tolist())
 raise ValueError(f'Unknown company {company!r}. Use an exact canonical name. Available companies: {available[:30]}')
def _required_level(raw):
 m=re.match(r'^\s*(10|[1-9])(?:\s*(?:-|$))',str(raw))
 if not m: raise ValueError(f'Invalid company benchmark level: {raw!r}')
 return int(m.group(1))
def _evidence(profile):
 evidence={cat:[] for cat in CATEGORIES}
 global_parts=[]
 for key in ('education','projects','hackathons','internships','certifications','achievements','experience','technical_skills','summary','bio','work_experience'):
  if profile.get(key):global_parts.append(flatten(profile[key]))
 for item in profile.get('skills',[]) or []:
  if isinstance(item,str): global_parts.append(item); continue
  if not isinstance(item,dict): continue
  cat=_category(item.get('category_code') or item.get('category') or item.get('skill_area'))
  text=' '.join(str(item.get(k) or '') for k in ('skill_name','evidence','description','name','proficiency','details'))
  if text.strip() and cat in evidence:evidence[cat].append(text)
  if text.strip():global_parts.append(text)
 # Category signal routing uses explicit category evidence first, then category-specific global evidence.
 alltext=' '.join(global_parts)
 signals={'COD':['coding','programming','python','java','c++','debugging','functions','code'],'DSA':['data structures','algorithms','big o','complexity','recursion'],'OOD':['object oriented','oop','classes','design patterns'],'APTI':['aptitude','problem solving','logical reasoning','quantitative'],'COMM':['communication','presentation','stakeholder','documentation'],'AI':['machine learning','artificial intelligence','scikit learn','regression','neural network'],'CLOUD':['cloud','docker','kubernetes','devops','deployment','distributed','scalable'],'SQL':['sql','mysql','database','query','relational'],'SWE':['software engineering','testing','unit tests','version control','maintainable','production'],'SYSD':['system design','architecture','pub sub','distributed service'],'NETW':['networking','tcp','http','dns','network protocols'],'OS':['operating system','process scheduling','multithreaded','linux','memory management']}
 for cat,terms in signals.items():
  if not evidence[cat] and any(norm(term) in norm(alltext) for term in terms): evidence[cat].append(alltext)
 return evidence
def score_profile(profile,company):
    topics=load_skill_topics(); companies=load_company_levels()
    validate_rubric(topics); validate_benchmarks(companies,BENCHMARK_COLUMNS)
    row=_find_company(company,companies); ev=_evidence(profile)
    output=[]; points=[]
    for cat,col in BENCHMARK_COLUMNS.items():
        required=_required_level(row[col]); candidate=estimate_level(cat,ev[cat],topics)
        gap=candidate<required
        output.append({'category_code':cat,'required_level':required,'candidate_level':candidate,'gap':gap})
        points.append(max(0, min(1, candidate / required)) if required>0 else 0)
  # An empty profile must not receive readiness credit.
  #has_evidence = bool(profile.get("skills"))

  #if not has_evidence:
       # readiness = 0
  #else:
   #     readiness = round(100 * sum(points) / len(points))
 
  #return {'company':str(row.companies),'skillset_gap':output,'readiness_score':max(0,min(100,readiness))}
 
    def _has_usable_evidence(profile):
        if not isinstance(profile, dict):
            return False

        evidence_fields = (
            "skills",
            "summary",
            "bio",
            "projects",
            "hackathons",
            "experience",
            "internships",
            "internships_and_experience",
            "certifications",
            "education",
            "achievements",
            "technical_skills",
            "work_experience",
        )

        def contains_evidence(value):
            if isinstance(value, str):
                return bool(value.strip())

            if isinstance(value, dict):
                return any(
                    contains_evidence(item)
                    for item in value.values()
                )

            if isinstance(value, (list, tuple)):
                return any(contains_evidence(item) for item in value)

            return False

        return any(
            contains_evidence(profile.get(field))
            for field in evidence_fields
        )

 
    has_evidence = _has_usable_evidence(profile)
    if not has_evidence:
        readiness = 0
    else:
        readiness = round(100 * sum(points) / len(points)) if points else 0

    return {
        "company": str(row.companies),
        "skillset_gap": output,
        "readiness_score": max(0, min(100, readiness))
 }
    
    