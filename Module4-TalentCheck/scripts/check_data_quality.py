"""Read-only diagnostics for the supplied benchmark/rubric snapshots."""
from talent_check.repository import load_company_levels, load_skill_topics
from talent_check.config import STRICT_SOURCE_MODE

def main():
    print(f"Source mode: {'Supabase (strict)' if STRICT_SOURCE_MODE else 'local CSV (explicitly enabled)'}")
    topics=load_skill_topics(); companies=load_company_levels()
    dup=companies[companies.company_normalized.duplicated(keep=False)].sort_values(['companies','id'])
    print(f"Rubric rows: {len(topics)}; company rows: {len(companies)}")
    if dup.empty: print('Company-name duplicates: none')
    else:
        print('Company-name duplicates (must be resolved by data owner; no row is selected automatically):')
        for name, group in dup.groupby('companies', sort=True):
            print(f"- {name}: rows={group['id'].tolist()}")
            for _, row in group.iterrows():
                print('  ', {c: row[c] for c in companies.columns if c not in {'company_normalized'}})
    print('Data-quality check completed; inspect output before scoring disputed companies.')
if __name__=='__main__': main()
