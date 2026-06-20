# mcp-cli Architecture

## Overview

`mcp-cli` is a universal MCP (Model Context Protocol) CLI client. It provides a command-line interface to any MCP server's tools without manual configuration. It ships with a built-in catalog of popular MCP servers, handles installation, authentication, and tool invocation automatically.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Coding Agent                                 │
│  (Claude Code, Cline, Continue, etc.)                               │
│                                                                     │
│  agent: "send a slack message"                                      │
│  └→ bash: mcp-cli slack send-message --channel general --text "hi"  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          mcp-cli CLI                                 │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐ │
│  │ Argument  │→ │  Catalog     │→ │  Auth       │→ │  Server       │ │
│  │ Parser    │  │  Resolver    │  │  Manager    │  │  Process      │ │
│  └──────────┘  └──────────────┘  └────────────┘  │  Manager      │ │
│                                                   └───────┬───────┘ │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐          │         │
│  │ Tool     │  │  Output      │  │  Cache      │          │         │
│  │ Dispatcher│→ │  Formatter   │  │  Manager    │          │         │
│  └──────────┘  └──────────────┘  └────────────┘          │         │
└───────────────────────────────────────────────────────────┬─────────┘
                                                            │
                                                            ▼
                                          ┌─────────────────────────────┐
                                          │     MCP Server Process      │
                                          │  (stdio transport)          │
                                          │                             │
                                          │  JSON-RPC: initialize       │
                                          │  JSON-RPC: tools/list       │
                                          │  JSON-RPC: tools/call       │
                                          └─────────────┬───────────────┘
                                                        │
                                                        ▼
                                          ┌─────────────────────────────┐
                                          │   External API              │
                                          │   (Slack, GitHub, Jira...)  │
                                          └─────────────────────────────┘
```

---

## Design Principles

1. **Zero config for common cases** — Popular MCP servers are pre-configured in the catalog. No JSON editing, no manual setup.
2. **Agent-first** — Every command supports `--json` output. Discovery (`tools list`) returns machine-parseable schemas. The CLI is designed to be called by agents.
3. **Auth handled once** — OAuth/API key/PAT is collected once, stored persistently, reused across sessions and reboots.
4. **Plug and play** — First use of a server triggers auto-install + auth. Subsequent calls are instant.
5. **Pure client** — `mcp-cli` does not host MCP servers. It spawns or connects to existing servers as a client, exactly like Claude Code.

---

## CLI Interface

### Syntax

```
mcp-cli <server>[:<instance>] <tool> [--param value...] [--json] [--verbose]
```

### Global Commands

| Command | Description |
|---|---|
| `mcp-cli tools list [--json]` | List all catalog servers and their available tools |
| `mcp-cli catalog update` | Fetch latest catalog from remote registry |
| `mcp-cli update <server>` | Upgrade a specific server to the version in catalog |
| `mcp-cli remove <server>[:<instance>]` | Uninstall a server and remove its tokens |
| `mcp-cli add-custom <name> [--command ...]` | Register a custom MCP server not in catalog |
| `mcp-cli <server> <tool> [args]` | Call a tool on a server |

### Tool Invocation

```
mcp-cli slack send-message --channel general --text "hello world" --json
mcp-cli github:personal search-issues --query "bug" --repo my-org/my-repo
mcp-cli postgres query --sql "SELECT * FROM users" --json
```

### Flags

| Flag | Description |
|---|---|
| `--json` | Output results as structured JSON (for agents) |
| `--verbose` | Print debug/trace info to stderr |
| `--log-file <path>` | Write detailed logs to a file |

---

## Execution Model: Spawn-per-Call

Each `mcp-cli` invocation is an independent process. The lifecycle for a tool call:

```
1. Parse CLI args         → server="slack", tool="send-message", args={channel, text}
       │
2. Resolve server         → Look up "slack" in ~/.mcp-cli/catalog.json
       │
3. Check installed        → Check ~/.mcp-cli/installed/slack/
       │
       ├── Not installed? → npm install @anthropic/mcp-slack into ~/.mcp-cli/installed/slack/
       │
4. Check auth tokens      → Check ~/.mcp-cli/auth/slack.json
       │
       ├── No tokens?     → Run auth flow (OAuth browser / prompt for API key / PAT)
       │
5. Check cached tools     → Check ~/.mcp-cli/cache/slack-tools.json
       │
       ├── No cache?      → Will fetch via tools/list (step 7)
       │
6. Spawn server process   → node ~/.mcp-cli/installed/slack/index.js with auth env vars
       │
7. JSON-RPC initialize    → Client ↔ Server handshake
       │
8. JSON-RPC tools/list    → Fetch tool schemas (if not cached; cache on response)
       │
9. Validate args          → Map CLI --params to JSON Schema from tool definition
       │
10. JSON-RPC tools/call   → Call the tool with args
       │
11. Format output         → Pretty print (human) or JSON (agent)
       │
12. Kill server process   → Clean exit
```

### Why Not Daemon Mode (v1)

- Each call is an independent CLI process (agents use bash tool per call)
- No background process lifecycle to manage
- Simpler debugging and error recovery
- Tool list caching to disk eliminates redundant handshakes on repeat calls
- Daemon mode reserved for v2 if latency proves problematic

---

## Catalog

### Storage

The catalog is a JSON file at `~/.mcp-cli/catalog.json`. It is bundled with the binary and copied to this path on first run.

### Schema

```json
{
  "version": 1,
  "updated": "2026-06-20T00:00:00Z",
  "servers": [
    {
      "name": "slack",
      "displayName": "Slack",
      "description": "Send and read Slack messages",
      "runtime": "node",
      "homepage": "https://github.com/modelcontextprotocol/slack",
      "install": {
        "command": "npm install -g @anthropic/mcp-slack",
        "version": "1.5.0"
      },
      "start": {
        "command": "npx @anthropic/mcp-slack",
        "env": {}
      },
      "auth": {
        "type": "oauth",
        "oauthConfig": {
          "clientId": "",
          "clientSecret": "",
          "scopes": ["channels:read", "channels:history", "chat:write"],
          "authorizationUrl": "https://slack.com/oauth/v2/authorize",
          "tokenUrl": "https://slack.com/api/oauth.v2.access"
        }
      }
    }
  ],
  "registries": [
    "https://registry.mcp-cli.dev/v1/catalog.json"
  ]
}
```

### Lifecycle

| Event | Action |
|---|---|
| First CLI run | Copy bundled catalog to `~/.mcp-cli/catalog.json` |
| `catalog update` | Fetch from remote registry, merge into local catalog, update `version` |
| CLI start | Read local catalog. If missing or corrupt, fall back to bundled version |

### Initial Server Set

| Server | Runtime | Auth | Category |
|---|---|---|---|
| Slack | node | OAuth | Communication |
| Discord | node | Bot Token | Communication |
| GitHub | node | PAT / OAuth | Code hosting |
| GitLab | node | PAT / OAuth | Code hosting |
| Jira | node | OAuth | Project management |
| Linear | node | API Key | Project management |
| Google Drive | node | OAuth | File storage |
| Postgres | node | Connection string | Database |
| Brave Search | node | API Key | Web search |
| Playwright | node | None | Browser automation |

---

## Authentication

### Auth Types

```
Auth
├── none        → No credentials needed
├── api-key     → Single key string, passed as env var
├── pat         → Personal Access Token, passed as env var
├── oauth       → OAuth 2.0 Authorization Code flow
└── env         → User must set an env var (e.g., DATABASE_URL)
```

### OAuth Flow

```
Agent: mcp-cli slack send-message --channel general --text "hi"
  │
  ▼
CLI checks ~/.mcp-cli/auth/slack.json  →  not found
  │
  ▼
CLI starts local HTTP server on random port
CLI constructs authorization URL with redirect_uri=http://localhost:PORT/callback
  │
  ▼
┌────────────────────────────────────────────────────┐
│  Can open browser?                                 │
│                                                    │
│  YES ─→ Open browser to authorization URL          │
│          User clicks "Allow" in browser             │
│          Browser redirects to localhost:PORT/callback│
│                                                    │
│  NO  ─→ Print URL to terminal                      │
│          "Open this URL in your browser:"           │
│          "https://slack.com/oauth/authorize?..."    │
│          "Paste the code from the redirect:"        │
│          User pastes code                           │
└────────────────────────────────────────────────────┘
  │
  ▼
CLI exchanges code for tokens (POST to tokenUrl)
Stores tokens in ~/.mcp-cli/auth/slack.json
  │
  ▼
Proceed to spawn server with tokens
```

### Token Storage

```
~/.mcp-cli/auth/
├── slack.json            { access_token, refresh_token, expires_at, token_type }
├── slack:work.json       (separate workspace)
├── github.json           { token, type: "pat" }
├── brave-search.json     { api_key }
└── postgres.json         { connection_string }
```

Tokens are persisted to disk. They survive reboots and agent restarts. Re-auth only needed if tokens expire and refresh fails.

### How Agent Drives Auth

1. Agent runs `mcp-cli slack send-message ...`
2. CLI detects missing tokens
3. If OAuth: CLI prints "Opening browser for Slack authorization..." → opens browser → user clicks Allow
4. If API key: `mcp-cli` prints `{"error": "auth_required", "type": "api_key", "message": "Enter your Brave API key"}` → agent reads this → agent asks user for the key → agent re-runs with the key or stores it
5. If PAT: same as API key but token type is "pat"

---

## Named Instances (Multi-Account)

A server can have multiple named instances, each with its own auth and config:

```
mcp-cli slack:work send-message --channel general --text "hi"
mcp-cli slack:personal send-message --channel family --text "dinner?"
```

The `:` separator tells the catalog resolver to look for instance-specific auth and cache files:

```
~/.mcp-cli/auth/slack:work.json
~/.mcp-cli/auth/slack:personal.json
~/.mcp-cli/cache/slack:work-tools.json
```

When only the server name is given (`mcp-cli slack ...`), the CLI uses the default instance (`slack.json`).

---

## Custom Servers & .mcp.json Compatibility

### Custom Servers

Users register servers not in the catalog:

```
mcp-cli add-custom my-db \
  --command "node my-mcp-server.js" \
  --runtime node \
  --auth-type env \
  --env DATABASE_URL
```

Custom servers are stored in `~/.mcp-cli/custom-servers.json` alongside the catalog.

### .mcp.json Compatibility

If a `.mcp.json` file exists in the current working directory, `mcp-cli` reads it and merges those server entries into the available tool pool. This ensures backward compatibility with existing Claude Code configurations.

---

## Agent Tool Discovery

The single entry point for agent discovery:

```
mcp-cli tools list --json
```

Returns:

```json
{
  "servers": [
    {
      "name": "slack",
      "displayName": "Slack",
      "status": "authenticated",
      "version": "1.5.0",
      "tools": [
        {
          "name": "send-message",
          "description": "Send a message to a Slack channel",
          "inputSchema": {
            "type": "object",
            "properties": {
              "channel": { "type": "string", "description": "Channel name or ID" },
              "text": { "type": "string", "description": "Message text" }
            },
            "required": ["channel", "text"]
          }
        }
      ]
    },
    {
      "name": "github",
      "displayName": "GitHub",
      "status": "not_authenticated",
      "version": "2.1.0",
      "tools": []
    }
  ]
}
```

The agent parses this to:
1. See what tools are available
2. Construct correct CLI invocations with the right `--param` flags
3. Detect `not_authenticated` servers and initiate auth flows
4. Detect `not_installed` servers and instruct the user or auto-install

---

## Output Format

### Human Mode (default)

```bash
$ mcp-cli slack send-message --channel general --text "hello"
✓ Message sent to #general
  ts: 1234567890.123456
  channel: C12345
```

### Agent Mode (--json)

```json
{
  "success": true,
  "server": "slack",
  "tool": "send-message",
  "duration_ms": 234,
  "data": {
    "ts": "1234567890.123456",
    "channel": "C12345"
  }
}
```

### Error Mode (--json)

```json
{
  "success": false,
  "error": {
    "code": "auth_required",
    "type": "oauth",
    "message": "Slack requires OAuth authorization",
    "url": "https://slack.com/oauth/authorize?..."
  }
}
```

---

## Directory Structure

```
~/.mcp-cli/
├── catalog.json                  # Server registry (bundled + updatable)
├── custom-servers.json           # User-added servers
├── auth/
│   ├── slack.json                # Tokens per server instance
│   └── github.json
├── installed/
│   ├── slack/                    # Installed server packages
│   │   ├── node_modules/
│   │   └── package.json
│   └── github/
├── cache/
│   ├── slack-tools.json          # Cached tools/list responses
│   └── github-tools.json
└── logs/
    └── mcp-cli.log               # Debug logs (when --log-file is used)
```

---

## Error Handling

| Scenario | Exit Code | Behavior |
|---|---|---|
| Server not in catalog | 1 | `{"error": "server_not_found", "name": "slack"}` |
| Server not installed | 0 | Auto-install, proceed |
| Auth missing | 1 | `{"error": "auth_required", "type": "oauth", "message": "..."}` |
| Auth expired | 1 | `{"error": "auth_expired", "server": "slack"}` → agent can re-trigger auth |
| Server process crashed | 1 | `{"error": "server_crashed", "stderr": "..."}` |
| Invalid arguments | 1 | `{"error": "validation_error", "expected": {...}}` |
| Network error | 1 | `{"error": "network_error", "message": "..."}` |
| Runtime missing | 1 | `{"error": "runtime_missing", "runtime": "node", "install_hint": "..."}` |
| Success | 0 | `{"success": true, "data": {...}}` |

---

## Dependency Management

Each catalog entry specifies a `"runtime"` field. The CLI checks if the runtime is available on `$PATH` before spawning the server:

```json
{
  "name": "postgres",
  "runtime": "node",
  "install": {
    "command": "npm install -g @anthropic/mcp-postgres",
    "version": "0.3.0"
  },
  "start": {
    "command": "npx @anthropic/mcp-postgres",
    "env": {
      "DATABASE_URL": ""
    }
  },
  "auth": {
    "type": "env",
    "envVar": "DATABASE_URL"
  }
}
```

If the runtime (`node`, `python`, `go`, `docker`) is not found, the CLI returns a clear install hint:

```json
{
  "error": "runtime_missing",
  "runtime": "node",
  "install_hint": "Download and install Node.js from https://nodejs.org/"
}
```

---

## Version Management

| Action | Effect |
|---|---|
| `mcp-cli catalog update` | Fetches latest catalog from remote registry. New versions of servers become available but are not auto-installed. |
| `mcp-cli update slack` | Re-installs `slack` to the version pinned in the current catalog. Old version is replaced. Cache (`tools/list`) is invalidated. |
| `mcp-cli remove slack` | Deletes `~/.mcp-cli/installed/slack/`, `~/.mcp-cli/auth/slack.json`, `~/.mcp-cli/cache/slack-tools.json`. |

Catalog entries pin versions. Auto-upgrade does not happen on tool call. Users explicitly run `catalog update` then `update <server>`.

---

## Security Model

- `mcp-cli` has no built-in permission/approval layer. It trusts the calling agent's own permission system.
- Tokens are stored as plain JSON in `~/.mcp-cli/auth/`. An optional OS keychain integration can encrypt them.
- Server processes are spawned as child processes of the CLI. They inherit the user's permissions.
- The CLI does not expose network ports except during OAuth callback (ephemeral, random port, localhost only).

---

## Out of Scope (v1)

- MCP Resources and Prompts support
- Daemon/background mode
- Built-in permission/approval UI
- Automatic offline operation
- Web dashboard or GUI
- Mobile support
- VS Code extension
