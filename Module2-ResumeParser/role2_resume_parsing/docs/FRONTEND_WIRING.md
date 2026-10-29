# Role 3 Frontend Wiring

Role 3 can send the selected resume to the standalone Role 2 API and pass the
whole response to `module2Adapter`.

```ts
async function parseResume(file: File) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 65_000);
  const body = new FormData();
  body.append("file", file);

  try {
    const response = await fetch("http://localhost:8000/parse-resume", {
      method: "POST",
      body,
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message ?? "Resume parsing failed.");
    }

    // Pass the complete Role 2 response, not only profile_prefill.
    return module2Adapter(payload);
  } finally {
    window.clearTimeout(timeout);
  }
}
```

The response is a `ResumeParseResult` with `schema_version`,
`profile_prefill`, `details`, `skills`, and `meta`. The profile prefill includes
name, email, education, skills, hackathons, internships, certifications,
preferred roles, and `cv_file` where available.

Errors have the JSON shape `{ "error": "...", "message": "..." }`:

- `422`: unreadable, empty, or corrupt upload.
- `400` or `415`: unsupported file type.
- `413`: file exceeds the API's 10 MB limit.
- `500`: unexpected server error.

Parsing can take several seconds. Show a loading state and use a timeout of at
least 60 seconds. A 5 MB frontend limit is fine because it is stricter than the
API limit.

Run the API with:

```bash
uvicorn resume_parser.api:app --reload --host 0.0.0.0 --port 8000
```

To change the port in PowerShell:

```powershell
$env:PORT = "9000"
uvicorn resume_parser.api:app --reload --host 0.0.0.0 --port $env:PORT
```

Set browser origins with `CORS_ORIGINS`, for example
`http://localhost:5173,http://localhost:3000`.

```bash
curl -X POST http://localhost:8000/parse-resume -F "file=@resume.pdf"
```

Suggestions for the canonical Role 3 profile, not requirements for this API:
keep hackathons and `cv_file` because they are part of the brief's profile
contract, and consider preserving `meta.dropped_skills` and skill
`source_kind` for review and downstream weighting.
