Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Authentication support for API key and PAT (Personal Access Token) auth types. When a server requires auth and no token is stored, prompt the user for the key/token, store it to `~/.mcp-cli/auth/<server>.json`, and inject it as an environment variable when spawning the server process.

- Auth type `api-key`: prompt for key, store, inject as env var
- Auth type `pat`: prompt for token, store, inject as env var
- Auth type `none`: no prompt, no env var injection
- Auth type `env`: read from existing env var, error if not set
- Token storage format: `{ type: "api-key"|"pat", value: "...", created_at: "..." }`
- On subsequent calls, read stored token without prompting
- If stored token exists but server rejects it, CLI prompts again
- Agent-friendly mode: if `--json`, return `{"error": "auth_required", "type": "api-key", ...}` instead of prompting

## Acceptance criteria

- [ ] First call to an API-key server without stored key → prompt for key → store → inject → call succeeds
- [ ] Second call skips prompt (reads from `~/.mcp-cli/auth/<server>.json`)
- [ ] With `--json`, no interactive prompt → returns `auth_required` error JSON
- [ ] PAT flow works identically to API key flow
- [ ] `auth/env` type reads from env var, errors if missing
- [ ] Test: mock server prints `$API_KEY` env var → assert correct injection
- [ ] Test: auth file correctly written and read back

## Blocked by

- GH #3 (#03 Auto-install on first use)
