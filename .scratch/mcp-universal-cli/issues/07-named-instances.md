Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Allow multiple instances of the same server with separate auth and configuration via the `<server>:<instance>` syntax. `mcp-cli slack:work send-message` routes to a different auth file, cache file, and install directory than `mcp-cli slack:personal`.

- Parse `server:instance` syntax in CLI args
- Route to `~/.mcp-cli/auth/slack:work.json` instead of `slack.json`
- Route to `~/.mcp-cli/cache/slack:work-tools.json` instead of `slack-tools.json`
- Route to `~/.mcp-cli/installed/slack:work/` instead of `slack/`
- `tools list --json` shows named instances separately

## Acceptance criteria

- [ ] `mcp-cli slack:work send-message --text "hi"` uses `slack:work.json` auth file
- [ ] `mcp-cli slack:personal send-message --text "hi"` uses `slack:personal.json` auth file
- [ ] Both instances work independently (different tokens, different caches)
- [ ] `server` without `:instance` falls back to default (`<server>.json`)
- [ ] `tools list --json` shows all configured instances
- [ ] Test: mock server echoes instance name → assert correct routing

## Blocked by

- GH #5 (#05 Auth: API key + PAT)
