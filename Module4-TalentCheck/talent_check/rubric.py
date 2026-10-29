"""Rubric integrity checks and canonical category mapping."""
from .schemas import CATEGORIES,CATEGORY_ALIASES
from .level_estimator import norm

def validate_rubric(topics):
    required={'skill_area','level_num','topics'}
    if not required<=set(topics.columns): raise RuntimeError(f'Rubric missing {sorted(required-set(topics.columns))}')
    if topics.duplicated(['skill_area','level_num']).any(): raise RuntimeError('Duplicate rubric area/level entries.')
    areas={norm(x) for x in topics.skill_area}
    missing=[]
    aliases={'COD':['coding'],'DSA':['data structures and algorithms'],'OOD':['object oriented design','object oriented programming and design'],'APTI':['aptitude','aptitude and problem solving'],'COMM':['communication','communication skills'],'AI':['ai','ai native engineering'],'CLOUD':['cloud','devops and cloud'],'SQL':['sql','sql and design','sql & design'],'SWE':['software engineering'],'SYSD':['system design','system design and architecture'],'NETW':['networking','computer networking'],'OS':['operating systems','operating system']}
    for cat in CATEGORIES:
        if not any(norm(a) in areas for a in aliases.get(cat,[CATEGORIES[cat]])): missing.append(cat)
    if missing: raise RuntimeError(f'Rubric lacks coverage for categories: {missing}')
    if not topics.level_num.between(1,10).all(): raise RuntimeError('Rubric levels outside 1–10.')
    return True

def validate_benchmarks(rows,columns):
    missing=[c for c in columns.values() if c not in rows.columns]
    if missing: raise RuntimeError(f'Benchmark columns missing: {missing}')
    import re
    for _,row in rows.iterrows():
        for cat,col in columns.items():
            m=re.match(r'^\s*(10|[1-9])(?:\s*(?:-|$))',str(row[col]))
            if not m: raise RuntimeError(f'Invalid benchmark level for {row.companies}/{cat}: {row[col]!r}')
    return True
