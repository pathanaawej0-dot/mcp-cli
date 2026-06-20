Status: ready-for-agent

# mcp-universal-cli

## Problem Statement

Setting up MCP (Model Context Protocol) servers today requires manually installing packages, editing JSON configuration files (`.mcp.json`, `claude.json`), configuring OAuth or API key auth flows, and restarting the agent. This is difficult for non-technical users and also burdensome for coding agents:

- Agents load all MCP tools into context even when only one is needed, wasting tokens and context window.
- Users must discover, install, and configure each MCP server manually.
- Authentication (especially OAuth flows) requires the user to leave their workflow, set up credentials, edit configs, and restart the agent.
- There is no universal catalog or registry of discoverable, pre-configured MCP servers.

The result: powerful MCP integrations (Slack, GitHub, Jira, Google Drive, databases) are underused because the setup friction is too high, especially for non-technical users and for agents operating autonomously.

## Solution

Build `mcp-cli`, a universal MCP client accessible via the command line. It ships with a **built-in catalog** of popular MCP servers — pre-configured with their install commands, auth flows, and tool schemas. A coding agent can call any MCP tool through a simple CLI syntax, and the CLI handles:

- Auto-installing the MCP server on first use
- Managing OAuth / API key / PAT authentication
- Token persistence across sessions and reboots
- Translating CLI args into JSON-RPC `tools/call` requests
- Returning structured JSON results for agent consumption

The core workflow: user says "send a message in Slack" → agent runs `mcp-cli slack send-message --channel general --text "hi"` → CLI discovers Slack in catalog, installs it, runs OAuth (opens browser for user to approve), calls the tool, returns the result. No JSON config editing. No agent restart.

## User Stories

1. As a user with a coding agent, I want the agent to call any MCP tool via a CLI command, so that the agent doesn't need native MCP protocol support.

2. As a user, I want `mcp-cli` to ship with a catalog of popular MCP servers pre-configured, so that I don't have to find and set up integrations manually.

3. As a user, I want the CLI to auto-install an MCP server on first use, so that there's no separate install step.

4. As a user, I want OAuth flows to open my browser automatically for authorization, so that I just click "Allow" without copying URLs or codes.

5. As a user, I want my OAuth/API tokens to persist across reboots, so that I don't re-authorize every session.

6. As a user, I want the CLI to fallback to printing the OAuth URL when there's no browser (SSH/CI), so that I can paste it manually.

7. As a user, I want the agent to prompt me for API keys or tokens when auth is needed, so that I don't need to manually configure them before the agent runs.

8. As a user, I want to use the same server with multiple accounts (e.g., work Slack + personal Slack), so that I can switch contexts without losing auth.

9. As a user, I want `mcp-cli` to read existing `.mcp.json` configs, so that I can reuse my existing MCP setups from Claude Code or other tools.

10. As a user, I want to add custom MCP servers not in the catalog via `mcp-cli add-custom`, so that I'm not limited to the built-in selection.

11. As a user, I want companies to be able to publish their MCP servers to the catalog, so that the ecosystem grows beyond what ships with the CLI.

12. As an agent developer, I want `mcp-cli tools list --json` to return all available tools with their schemas, so that I can dynamically decide which tools to call.

13. As a user, I want `mcp-cli --json` output on every tool call, so that agents can parse results programmatically.

14. As a user, I want to run `mcp-cli catalog update` to pull the latest catalog entries, so that I get newly published servers.

15. As a user, I want to run `mcp-cli update <server>` to upgrade a specific server, so that I control when breaking changes happen.

16. As a user, I want `mcp-cli remove <server>` to uninstall a server and clean up its tokens, so that I can manage disk space and revoke access.

17. As a user, I want `--verbose` and `--log-file` flags for debugging, so that I can diagnose auth or connection failures.

18. As a user, I want the CLI to check for required runtimes (Node.js, Python, etc.) and give clear install instructions if missing, so that I know what to install.

## Implementation Decisions

### CLI & Runtime

- **Language:** TypeScript/Node.js, compiled to a standalone binary (via `bun build --compile` or `pkg`) so users don't need Node.js installed.
- **CLI entrypoint:** `mcp-cli <server> <tool> [--param value...] [--json]`
- **Execution model:** Spawn-per-call (v1). Each `mcp-cli` invocation is a separate process. The CLI spawns the MCP server, connects, calls the tool, returns the result, and kills the server process.
- **Tool list caching:** `tools/list` response is cached to disk (`~/.mcp-cli/cache/<server>-tools.json`) to skip the handshake on subsequent calls. Invalidated when the server version changes.
- **Daemon mode:** Out of scope for v1. Revisit if per-call latency proves problematic.

### Catalog

- **Format:** JSON file bundled with the CLI at `~/.mcp-cli/catalog.json` (copied from the binary on first run).
- **Initial scope:** 10+ popular servers: Slack, GitHub, GitLab, Jira, Google Drive, Postgres, Brave Search, Playwright, Discord, Linear.
- **Registry:** A central remote registry (`registry.mcp-cli.dev`). Companies publish their MCP servers via a website. The CLI fetches from this registry on `mcp-cli catalog update`.
- **Custom sources:** Users can add external registries.
- **Version pinning:** Each catalog entry pins a specific version. Versions only change when the catalog entry is explicitly updated. Users run `mcp-cli update <server>` to upgrade.
- **Schema (per entry):**

```json
{
  "name": "slack",
  "displayName": "Slack",
  "description": "Send and read Slack messages",
  "runtime": "node",
  "install": {
    "command": "npm install -g @anthropic/mcp-slack"
  },
  "start": {
    "command": "npx @anthropic/mcp-slack"
  },
  "auth": {
    "type": "oauth",
    "oauthConfig": {
      "clientId": "...",
      "scopes": ["channels:read", "chat:write"],
      "authorizationUrl": "https://slack.com/oauth/v2/authorize",
      "tokenUrl": "https://slack.com/api/oauth.v2.access"
    }
  }
}
```

### Auth

- **API key:** CLI prompts user for key (agent reads from env). Stored in `~/.mcp-cli/auth/<server>.json`.
- **OAuth 2.0:** CLI starts a local HTTP callback server, opens browser to authorization URL. On callback, exchanges code for tokens. Stores tokens. Headless fallback: prints URL, waits for user to paste code back.
- **PAT / Token:** CLI prompts user to paste token. Stored same as API key.
- **Token storage:** `~/.mcp-cli/auth/` — one JSON file per server instance. Optionally encrypted via OS keychain.
- **Named instances:** `mcp-cli slack:work send-message` uses a different auth file (`slack:work.json`) than `mcp-cli slack:personal`.

### Error Handling & Observability

- Errors return non-zero exit code and JSON error on stdout: `{"error": "...", "code": 1}`
- Stderr reserved for progress messages (human-readable)
- `--verbose` adds debug tracing to stderr
- `--log-file <path>` writes full trace to a file for deep debugging

### Scope

- **In v1:** Tools only (no MCP Resources or Prompts).
- **In v1:** No permission layer — CLI trusts the calling agent's own permission system.
- **In v1:** No daemon mode.
- **In v1:** No automatic offline support (cloud APIs need internet).

## Testing Decisions

- **What to test:** External behavior only — given CLI args, verify correct JSON output, correct server process spawning, correct auth flow, correct error responses. Do not test MCP SDK internals.
- **Modules to test:**
  - Argument parser: correctly maps `--param value` to JSON-RPC args
  - Catalog resolution: correctly resolves `<server>:<instance>` to catalog entry
  - Auth lifecycle: token storage, retrieval, expiry detection, OAuth callback handler
  - Server process management: spawn, `initialize`, `tools/list` caching, `tools/call`, clean kill
  - Error output: correct JSON error shape on server crash, auth failure, missing runtime
- **Testing approach:** Use mock MCP servers (simple Node.js scripts that respond to JSON-RPC over stdio). Unit test argument parsing and catalog resolution. Integration test the full spawn → call → kill cycle against a mock server.

## Out of Scope

- MCP Resources and Prompts support (v2)
- Daemon/background mode (v2)
- Built-in permission/approval layer (trusts agent's own system)
- Offline-first operation (cloud APIs need internet)
- Web UI or GUI
- Mobile app
- VS Code / IDE extension

## Further Notes

- The CLI is purely a client — it does not host or run MCP servers for others. This matches Claude Code's architecture.
- The catalog's initial 10 servers should be chosen based on what coding agents most commonly need: communication (Slack, Discord), code hosting (GitHub, GitLab), project management (Jira, Linear), file access (Google Drive), data (Postgres), web (Brave Search, Playwright).
- The `mcp-cli tools list --json` command is the single entry point for agent discovery — it's critical that this returns a clean, parseable schema.
