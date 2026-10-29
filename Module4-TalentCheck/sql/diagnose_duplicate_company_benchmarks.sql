-- Read-only. Run in Supabase SQL Editor to inspect conflicting company rows.
SELECT companies, COUNT(*) AS row_count, ARRAY_AGG(id ORDER BY id) AS row_ids
FROM public.staging_company_skill_levels
GROUP BY companies
HAVING COUNT(*) > 1
ORDER BY companies;

-- Inspect every field for the known duplicated company (do not delete a row until
-- the data owner confirms which row is authoritative).
SELECT *
FROM public.staging_company_skill_levels
WHERE LOWER(TRIM(companies)) = LOWER(TRIM('ZS Associates, Inc.'))
ORDER BY id;
