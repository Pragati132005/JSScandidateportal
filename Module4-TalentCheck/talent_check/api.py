from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from .schemas import TalentCheckRequest,TalentCheckResponse
from .profile_adapter import adapt_profile
from .scoring import score_profile
from .service import run_talent_check
from .repository import load_company_levels,load_skill_topics,clear_cache
app=FastAPI(title='RADIX Talent Check — Module 4',version='2.0.0')
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173','http://127.0.0.1:5173'],allow_credentials=False,allow_methods=['GET','POST'],allow_headers=['Content-Type','Authorization'])
def error(code,message): return {'error':{'code':code,'message':message}}
@app.get('/health')
def health(): return {'status':'ok','module':'talent_check','version':'2.0.0'}
@app.get('/companies')
def companies():
 try:return {'companies':sorted(load_company_levels().companies.astype(str).tolist())}
 except Exception as e: raise HTTPException(503,detail=error('DATA_SOURCE_UNAVAILABLE',str(e)))
@app.post('/talent-check',response_model=TalentCheckResponse)
def talent_check(request:TalentCheckRequest):
 try:return score_profile(adapt_profile(request.model_dump()),request.company)
 except ValueError as e: raise HTTPException(422,detail=error('INVALID_REQUEST_OR_COMPANY',str(e)))
 except Exception as e: raise HTTPException(503,detail=error('TALENT_CHECK_UNAVAILABLE',str(e)))
@app.post('/talent-check/details')
def talent_check_details(payload:dict):
 try:return run_talent_check(payload)
 except ValueError as e: raise HTTPException(422,detail=error('INVALID_REQUEST_OR_COMPANY',str(e)))
 except Exception as e: raise HTTPException(503,detail=error('TALENT_CHECK_UNAVAILABLE',str(e)))
@app.get('/health/data')
def data_health():
 try:
  rows=load_company_levels()
  dup=rows[rows.company_normalized.duplicated(keep=False)].companies.unique().tolist()
  return {'status':'ok','source':'supabase' if __import__('talent_check.config',fromlist=['STRICT_SOURCE_MODE']).STRICT_SOURCE_MODE else 'csv','company_rows':len(rows),'skill_topic_rows':len(load_skill_topics()),'duplicate_company_names':sorted(dup)}
 except Exception as e: raise HTTPException(503,detail=error('DATA_SOURCE_UNAVAILABLE',str(e)))
@app.post('/admin/reload-data')
def reload_data():
 clear_cache()
 try:return {'status':'reloaded','company_rows':len(load_company_levels()),'skill_topic_rows':len(load_skill_topics())}
 except Exception as e: raise HTTPException(503,detail=error('DATA_SOURCE_UNAVAILABLE',str(e)))
