# RADIX Talent Match - Unified Multi-Service Launch Script
Write-Host "Starting all RADIX Talent Match services..." -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Profile Backend (Port 8040)
Start-Process -FilePath "$root\profilebackend\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn profilebackend.main:app --host 127.0.0.1 --port 8040" `
  -WorkingDirectory "$root"

# 2. Module 1: JD Analyzer (Port 8020)
Start-Process -FilePath "$root\Module1-JDAnalyzer\radix-jd-analytics-main\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn src.api:app --host 127.0.0.1 --port 8020" `
  -WorkingDirectory "$root\Module1-JDAnalyzer\radix-jd-analytics-main"

# 3. Module 2: Resume Parser (Port 8000)
Start-Process -FilePath "$root\Module2-ResumeParser\role2_resume_parsing\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn resume_parser.api:app --host 127.0.0.1 --port 8000" `
  -WorkingDirectory "$root\Module2-ResumeParser\role2_resume_parsing"

# 4. Module 4: Talent Check (Port 8010)
Start-Process -FilePath "$root\Module4-TalentCheck\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn talent_check.api:app --host 127.0.0.1 --port 8010" `
  -WorkingDirectory "$root\Module4-TalentCheck"

# 5. Module 5: Skill Match (Port 8030)
Start-Process -FilePath "$root\Module5-SkillMatch\role5\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8030" `
  -WorkingDirectory "$root\Module5-SkillMatch\role5"

# 6. Module 3: Frontend (Port 5173)
Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c npm run dev" `
  -WorkingDirectory "$root\Module3-ProfileBuilder\JSScandidateportal-profilebuilder"

Write-Host "All services initiated. Web portal accessible at: http://localhost:5173" -ForegroundColor Green
