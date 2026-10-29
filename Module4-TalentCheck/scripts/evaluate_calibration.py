"""Evaluate estimator predictions against an expert-adjudicated JSONL gold set."""
import json, os, sys
from pathlib import Path
from statistics import mean
os.environ.setdefault('TALENT_CHECK_SOURCE_MODE','csv')
from talent_check.scoring import score_profile
from talent_check.profile_adapter import adapt_profile

def main(path='calibration/gold_profiles.jsonl'):
    p=Path(path)
    if not p.exists():
        raise SystemExit(f"Gold set not found: {p}. Copy gold_profiles_template.jsonl to gold_profiles.jsonl and replace all template labels with reviewed data.")
    errors=[]; within_one=0; total=0
    for line_no,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1):
        if not line.strip(): continue
        item=json.loads(line)
        if not item.get('adjudicated'):
            raise SystemExit(f"Line {line_no}: profile is not marked adjudicated; only evaluate agreed expert labels.")
        profile=adapt_profile(item.get('profile',{}))
        company=item.get('company')
        if not company: raise SystemExit(f"Line {line_no}: company is required.")
        result=score_profile(profile,company)
        expected=item.get('expected_levels',{})
        pred={x['category_code']:x['candidate_level'] for x in result['skillset_gap']}
        for cat,level in expected.items():
            if cat not in pred: continue
            err=abs(pred[cat]-int(level)); errors.append(err); within_one += err<=1; total+=1
    if not total: raise SystemExit('No expected category labels found.')
    print(f'Labels evaluated: {total}')
    print(f'MAE: {mean(errors):.3f}')
    print(f'Within +/-1 level: {100*within_one/total:.1f}%')
    print('These metrics are meaningful only if labels were independently reviewed and held out from rule tuning.')
if __name__=='__main__': main(sys.argv[1] if len(sys.argv)>1 else 'calibration/gold_profiles.jsonl')
