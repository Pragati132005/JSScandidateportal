# JSScandidateportal

## Role 5 Skill-Matching integration

The portal should call the deployed Role 5 API after it has received the Role 1
JD Analytics result and the Role 3 Candidate Profiling result.

Set the portal environment variable below to the public URL of the deployed
Role 5 service (do not include a trailing slash):

```text
ROLE5_API_BASE_URL=https://<your-role5-host>
```

Send the integration request to:

```text
POST ${ROLE5_API_BASE_URL}/api/v1/skill-match
Content-Type: application/json
```

```json
{
  "role1": "<the complete Role 1 JD Analytics JSON object>",
  "role3": "<the complete Role 3 Candidate Profiling JSON object>"
}
```

`role1_jd_analytics` and `role3_candidate_profiling` are equivalent accepted
field names. The service health endpoint is
`${ROLE5_API_BASE_URL}/health` (also available at `/api/v1/health`).

The Role 5 service accepts browser-originated requests, so no proxy is needed
solely for CORS. Handle non-2xx responses in the portal and display the API's
JSON validation message when present.
