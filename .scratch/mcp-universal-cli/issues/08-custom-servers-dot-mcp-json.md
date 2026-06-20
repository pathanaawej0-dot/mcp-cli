Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Allow users to register MCP servers not in the catalog via `mcp-cli add-custom`, and read `.mcp.json` files from the current working directory for backward compatibility with existing MCP configs.

- `mcp-cli add-custom <name> --command <cmd> [--runtime node] [--auth-type none]` stores entry in `~/.mcp-cli/custom-servers.json`
- Custom servers appear in `tools list --json` alongside catalog servers
- If `.mcp.json` exists in CWD, merge its `mcpServers` entries into available pool
- `.mcp.json` entries override catalog/custom entries with the same name
- Custom server entries support the same auth/install/start schema as catalog entries

## Acceptance criteria

- [ ] `mcp-cli add-custom my-server --command "node server.js"` writes to `custom-servers.json`
- [ ] `mcp-cli my-server my-tool` resolves from custom-servers and works
- [ ] Tools from custom servers appear in `tools list --json`
- [ ] `.mcp.json` with valid `mcpServers` is detected in CWD and merged
- [ ] `.mcp.json` entry overrides catalog entry of same name
- [ ] Test: write `.mcp.json` to temp dir, run `tools list` → assert entries appear

## Blocked by

- GH #3 (#03 Auto-install on first use)
