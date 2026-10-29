from typing import Any,Literal
from pydantic import BaseModel,Field,ConfigDict,field_validator
CATEGORIES={'COD':'Coding','DSA':'Data Structures and Algorithms','OOD':'Object-Oriented Design','APTI':'Aptitude','COMM':'Communication','AI':'AI','CLOUD':'Cloud','SQL':'SQL','SWE':'Software Engineering','SYSD':'System Design','NETW':'Networking','OS':'Operating Systems'}
CATEGORY_ALIASES={'coding':'COD','programming':'COD','data structures and algorithms':'DSA','dsa':'DSA','object-oriented design':'OOD','object oriented design':'OOD','object-oriented programming and design':'OOD','oop':'OOD','aptitude':'APTI','aptitude and problem solving':'APTI','communication':'COMM','communication skills':'COMM','ai':'AI','artificial intelligence':'AI','ai native engineering':'AI','cloud':'CLOUD','devops and cloud':'CLOUD','sql':'SQL','sql and design':'SQL','software engineering':'SWE','system design':'SYSD','system design and architecture':'SYSD','networking':'NETW','computer networking':'NETW','operating systems':'OS','operating system':'OS'}
class SkillEvidence(BaseModel):
 model_config=ConfigDict(extra='allow')
 skill_name:str=''; category_code:str='OTHER'; evidence:str=''; confidence:Literal['high','medium','low']|None=None; level:int|None=Field(default=None,ge=1,le=10)
class CandidateProfile(BaseModel):
 model_config=ConfigDict(extra='allow')
 name:str|None=None; email:str|None=None; education:Any=None; skills:list[Any]=Field(default_factory=list); projects:list[Any]=Field(default_factory=list); hackathons:list[Any]=Field(default_factory=list); internships:list[Any]=Field(default_factory=list); certifications:list[Any]=Field(default_factory=list); preferred_roles:list[str]=Field(default_factory=list); cv_file:str|None=None
class TalentCheckRequest(BaseModel):
 model_config=ConfigDict(extra='allow')
 profile:dict[str,Any]
 company:str=Field(min_length=1,max_length=200)
 @field_validator('company')
 @classmethod
 def company_trim(cls,v):
  v=v.strip()
  if not v:raise ValueError('company must not be blank')
  return v
class SkillsetGap(BaseModel): category_code:str; required_level:int=Field(ge=1,le=10); candidate_level:int=Field(ge=1,le=10); gap:bool
class TalentCheckResponse(BaseModel): company:str; skillset_gap:list[SkillsetGap]; readiness_score:int=Field(ge=0,le=100)
