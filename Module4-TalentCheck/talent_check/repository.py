from functools import lru_cache
import pandas as pd
from .config import *
from .supabase_client import create_supabase_client,read_table

def _read(table,path):
    if STRICT_SOURCE_MODE: return pd.DataFrame(read_table(create_supabase_client(),table,'id'))
    if not path.exists(): raise RuntimeError(f'Local CSV not found: {path}')
    return pd.read_csv(path)

def _topics(df):
    need={'id','skill_area','levels','topics'}
    if not need<=set(df.columns): raise RuntimeError(f'Skill topic source missing columns: {sorted(need-set(df.columns))}')
    df=df.copy(); df['skill_area']=df.skill_area.astype(str).str.strip()
    df['level_num']=df.levels.astype(str).str.extract(r'(?i)level\s*(\d+)')[0]
    if df.level_num.isna().any(): raise RuntimeError('Skill topic source contains invalid levels.')
    df['level_num']=df.level_num.astype(int)
    if not df.level_num.between(1,10).all(): raise RuntimeError('Skill topic levels must be 1–10.')
    if df.topics.isna().any() or (df.topics.astype(str).str.strip()=='').any(): raise RuntimeError('Empty topic rubric entries found.')
    dup=df.duplicated(['skill_area','level_num'],keep=False)
    if dup.any(): raise RuntimeError(f'Duplicate rubric entries: {df.loc[dup, ["skill_area","level_num"]].to_dict("records")[:10]}')
    return df.sort_values(['skill_area','level_num','id'],kind='stable').reset_index(drop=True)

def _companies(df):
    columns={'id','companies','coding','data_structures_and_algorithms','object_oriented_programming_and_design','aptitude_and_problem_solving','communication_skills','ai_native_engineering','devops_and_cloud','sql_and_design','software_engineering','system_design_and_architecture','computer_networking','operating_system'}
    if not columns<=set(df.columns): raise RuntimeError(f'Company benchmark source missing columns: {sorted(columns-set(df.columns))}')
    df=df.copy(); df['companies']=df.companies.astype(str).str.strip()
    if (df.companies=='').any(): raise RuntimeError('Blank company names in benchmark source.')
    df['company_normalized']=df.companies.str.casefold()
    # Keep all rows so a duplicate name can be reported with row IDs and handled
    # explicitly by the scoring layer. Never select the first matching row.
    return df.sort_values(['companies','id'],kind='stable').reset_index(drop=True)
@lru_cache(maxsize=1)
def load_skill_topics(): return _topics(_read(SUPABASE_SKILL_TOPICS_TABLE,SKILL_TOPICS_CSV))
@lru_cache(maxsize=1)
def load_company_levels(): return _companies(_read(SUPABASE_COMPANY_LEVELS_TABLE,COMPANY_LEVELS_CSV))
def clear_cache(): load_skill_topics.cache_clear(); load_company_levels.cache_clear()
