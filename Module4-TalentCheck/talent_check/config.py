from pathlib import Path
import os
from dotenv import load_dotenv
ROOT=Path(__file__).resolve().parents[1]
load_dotenv(ROOT/'.env')
DATA_DIR=ROOT/'data'
SKILL_TOPICS_CSV=Path(os.getenv('SKILL_TOPICS_CSV',str(DATA_DIR/'staging_skill_topics.csv')))
COMPANY_LEVELS_CSV=Path(os.getenv('COMPANY_LEVELS_CSV',str(DATA_DIR/'staging_company_skill_levels.csv')))
SUPABASE_URL=os.getenv('SUPABASE_URL','').strip()
SUPABASE_KEY=os.getenv('SUPABASE_KEY','').strip()
SUPABASE_SKILL_TOPICS_TABLE=os.getenv('SUPABASE_SKILL_TOPICS_TABLE','staging_skill_topics').strip()
SUPABASE_COMPANY_LEVELS_TABLE=os.getenv('SUPABASE_COMPANY_LEVELS_TABLE','staging_company_skill_levels').strip()
STRICT_SOURCE_MODE=os.getenv('TALENT_CHECK_SOURCE_MODE','supabase').strip().lower()=='supabase'
SUPABASE_PAGE_SIZE=int(os.getenv('SUPABASE_PAGE_SIZE','500'))
SUPABASE_MAX_ROWS=int(os.getenv('SUPABASE_MAX_ROWS','50000'))
