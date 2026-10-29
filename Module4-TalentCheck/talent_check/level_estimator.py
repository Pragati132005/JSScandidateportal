"""Deterministic rubric-driven proficiency estimator with deduplicated evidence."""
import re
from .schemas import CATEGORIES
ALIASES={'OOD':['Object-Oriented Design','Object-Oriented Programming and Design'],'APTI':['Aptitude','Aptitude and Problem Solving'],'COMM':['Communication','Communication Skills'],'AI':['AI','AI Native Engineering'],'CLOUD':['Cloud','DevOps and Cloud'],'SQL':['SQL','SQL and Design','SQL & Design'],'SYSD':['System Design','System Design and Architecture'],'NETW':['Networking','Computer Networking'],'OS':['Operating Systems','Operating System']}
def norm(s): return re.sub(r'[^a-z0-9+#.]+',' ',str(s).casefold()).strip()
def flatten(v):
    if v is None:return ''
    if isinstance(v,str):return v
    if isinstance(v,dict):return ' '.join(flatten(x) for k,x in v.items() if k not in {'email','phone','name','id'})
    if isinstance(v,(list,tuple,set)):return ' '.join(flatten(x) for x in v)
    return str(v)
def topic_match(topic,evidence):
    t,e=norm(topic),norm(evidence)
    if not t or not e:return False
    if t in e:return True
    stop={'and','or','the','of','for','with','to','in','a','an','on','using','basic','introduction'}
    tt={x for x in t.split() if x not in stop and len(x)>1}; et=set(e.split())
    return bool(tt) and len(tt&et)>=min(2,len(tt)) and len(tt&et)/len(tt)>=.65
def estimate_level(cat,evidence,topics):
    if cat not in CATEGORIES or not evidence:return 1
    areas={x.casefold() for x in ALIASES.get(cat,[CATEGORIES[cat]])}
    areas.add(CATEGORIES[cat].casefold())
    candidates=topics[topics.skill_area.astype(str).str.strip().str.casefold().isin(areas)]
    # Deduplicate repeated phrases and evidence before counting support.
    text=' '.join(dict.fromkeys(norm(x) for x in evidence if norm(x)))
    if candidates.empty:return 1
    matched=[]
    for _,row in candidates.iterrows():
        signals={norm(x) for x in str(row.topics).split(';') if norm(x) and topic_match(x,text)}
        level=int(row.level_num)
        if len(signals)>=(1 if level<=3 else 2): matched.append((level,signals))
    if not matched:
        applied=any(x in text for x in ('built', 'implemented', 'designed',
        'deployed', 'shipped', 'developed', 'tested',
        'wrote', 'created', 'used', 'queried',
        'executed', 'analyzed', 'analysed'))
        return 2 if applied else 1
    level=max(x[0] for x in matched)
    distinct=set().union(*(x[1] for x in matched))
    # Advanced levels require a breadth of independent rubric signals.
    if level>=7 and len(distinct)<4: level=min(level,6)
    if level>=5 and len(distinct)<2: level=min(level,4)
    return max(1,min(10,level))
