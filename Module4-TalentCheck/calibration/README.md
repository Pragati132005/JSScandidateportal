# Human-reviewed scoring calibration

Automated tests check invariants and regression behaviour; they cannot prove that estimated levels are valid without an expert-labelled gold set. Use `gold_profiles_template.jsonl` to record manually reviewed profile evidence and expected category levels (1–10). Have two reviewers score independently, reconcile disagreements, then compare estimator levels against the agreed labels.

Recommended acceptance gates before demo/production:
- exact category coverage for all 12 categories;
- mean absolute error (MAE) <= 1.5 levels on held-out profiles;
- >= 80% of predictions within +/- 1 level;
- no duplicate evidence changes a rating;
- missing evidence remains level 1 and is clearly labelled as “no evidence found”, not proof of no skill;
- review false-positive high levels (7–10) manually.

Do not treat these thresholds as achieved until a real labelled set has been scored. Sample resumes in `examples/` are raw text; they are not expert labels and should not be used to claim accuracy.
