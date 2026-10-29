"""Fail-closed Supabase reads with stable ordering and pagination."""
def create_supabase_client():
    from .config import SUPABASE_URL,SUPABASE_KEY
    if not SUPABASE_URL or not SUPABASE_KEY: raise RuntimeError('Strict Supabase mode requires SUPABASE_URL and SUPABASE_KEY in .env.')
    if not SUPABASE_URL.startswith('https://') or '.supabase.co' not in SUPABASE_URL: raise RuntimeError('SUPABASE_URL must be the HTTPS URL of your Supabase project.')
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL,SUPABASE_KEY)
    except Exception as e: raise RuntimeError(f'Supabase client initialization failed ({type(e).__name__}). Check credentials and dependency.') from e

def read_table(client,table,order_column='id'):
    from .config import SUPABASE_PAGE_SIZE,SUPABASE_MAX_ROWS
    if not table.replace('_','').isalnum(): raise RuntimeError(f'Unsafe table identifier: {table!r}')
    rows=[]; offset=0
    while True:
        try: result=client.table(table).select('*').order(order_column).range(offset,offset+SUPABASE_PAGE_SIZE-1).execute()
        except Exception as e:
            msg=str(e).lower()
            if any(x in msg for x in ('permission','row level security','rls','401','403')): raise RuntimeError(f'Supabase permission denied for {table}; verify table grants, RLS policies and server-side key.') from e
            raise RuntimeError(f'Supabase read failed for {table} at offset {offset} ({type(e).__name__}).') from e
        batch=getattr(result,'data',None)
        if not isinstance(batch,list): raise RuntimeError(f'Supabase returned invalid data for {table}.')
        if not batch: break
        rows.extend(batch)
        if len(rows)>SUPABASE_MAX_ROWS: raise RuntimeError(f'{table} exceeded SUPABASE_MAX_ROWS={SUPABASE_MAX_ROWS}; refusing potentially incomplete data.')
        if len(batch)<SUPABASE_PAGE_SIZE: break
        offset+=len(batch)
    if not rows: raise RuntimeError(f'Supabase table {table} is empty or unreadable.')
    return rows
