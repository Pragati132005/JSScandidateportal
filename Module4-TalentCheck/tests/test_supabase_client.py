from types import SimpleNamespace
from talent_check.supabase_client import read_table
class Query:
 def __init__(self,client):self.c=client
 def select(self,*a):return self
 def order(self,*a):return self
 def range(self,a,b):self.c.offset=a;return self
 def execute(self):
  self.c.calls+=1
  return SimpleNamespace(data=self.c.pages.pop(0))
class Client:
 def __init__(self,pages):self.pages=list(pages);self.calls=0;self.offset=0
 def table(self,name):return Query(self)
def test_pagination_reads_all_pages(monkeypatch):
 import talent_check.config as c
 monkeypatch.setattr(c,'SUPABASE_PAGE_SIZE',2);monkeypatch.setattr(c,'SUPABASE_MAX_ROWS',10)
 client=Client([[{'id':1},{'id':2}],[{'id':3}],[]])
 assert [r['id'] for r in read_table(client,'sample')]==[1,2,3]
 assert client.calls==2
def test_empty_table_fails_closed(monkeypatch):
 import talent_check.config as c
 monkeypatch.setattr(c,'SUPABASE_PAGE_SIZE',2);monkeypatch.setattr(c,'SUPABASE_MAX_ROWS',10)
 try:read_table(Client([[]]),'sample')
 except RuntimeError as e:assert 'empty or unreadable' in str(e)
 else:assert False
