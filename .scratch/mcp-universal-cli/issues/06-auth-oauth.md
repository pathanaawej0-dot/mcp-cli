Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Full OAuth 2.0 Authorization Code flow. When a server has `auth.type: "oauth"` and no valid tokens, start a local HTTP server on a random port, open the browser to the authorization URL, handle the callback, exchange the code for tokens, and store them.

- Start ephemeral HTTP server on localhost:random port
- Open browser to authorization URL with `redirect_uri=http://localhost:<port>/callback`
- Handle callback: extract `?code=...`, exchange POST to `tokenUrl`
- Store tokens: `{ access_token, refresh_token?, expires_at?, token_type }`
- Token refresh: if token expired, use `refresh_token` to get new pair
- Headless fallback: if `BROWSER` env var not available or `CI=true`, print URL and wait for user to paste code back
- 15-min token cache to avoid repeated prompts within a session

## Acceptance criteria

- [ ] OAuth flow starts, browser opens to correct URL with proper params
- [ ] Callback server handles GET, extracts code, exchanges it
- [ ] Tokens persist to `~/.mcp-cli/auth/<server>.json`
- [ ] Subsequent calls skip OAuth (tokens already stored)
- [ ] Expired token triggers refresh flow
- [ ] Headless mode: prints URL, accepts pasted code, continues flow
- [ ] Test: mock OAuth provider (starts local server that redirects to callback with a code)
- [ ] Test: assert browser URL contains correct `client_id`, `redirect_uri`, `scopes`

## Blocked by

- GH #5 (#05 Auth: API key + PAT)
