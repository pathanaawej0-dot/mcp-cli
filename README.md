# mcp-cli

A universal MCP (Model Context Protocol) CLI client. Call any MCP server's tools from the command line without manual configuration.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run commands
node packages/cli/dist/cli.js --version
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js tools list --json
```

## Usage

```
mcp-cli <server>[:<instance>] <tool> [--param value...] [--json] [--verbose]
```

### Global Commands

| Command | Description |
|---|---|
| `tools list [--json]` | List all catalog servers and their tools |
| `catalog update` | Fetch latest catalog from remote registry |
| `update <server>` | Upgrade a specific server |
| `remove <server>[:<instance>]` | Uninstall a server and remove its tokens |
| `add-custom <name> [--command ...]` | Register a custom MCP server |

### Flags

| Flag | Description |
|---|---|
| `--json` | Output results as structured JSON |
| `--verbose` | Print debug/trace info to stderr |
| `--log-file <path>` | Write detailed logs to a file |
| `--version` | Print version and exit |
| `--help` | Print help and exit |

## Development

```bash
# Run in dev mode (no build needed)
cd packages/cli
npx tsx src/cli.ts tools list --json

# Run tests
pnpm test
```

## Project Structure

```
mcp-cli/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # Monorepo workspace
├── ARCHITECTURE.md           # Full architecture spec
├── packages/
│   └── cli/                  # Main CLI package
│       ├── src/cli.ts        # CLI entry point
│       ├── catalog/catalog.json  # Bundled server catalog
│       └── tests/            # Integration tests
└── .scratch/                 # Issue tracking (local markdown files)
```

## Catalog

The catalog ships with 3 starter server entries:

| Server | Auth Type | Description |
|---|---|---|
| mock | none | No-auth mock MCP server for testing |
| brave-search | api-key | Web search via Brave Search API |
| slack | oauth | Send and read Slack messages |

On first run, the bundled catalog is copied to `~/.mcp-cli/catalog.json`.

## License

MIT
