Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

The CLI binary skeleton that parses global commands and outputs the catalog. Create the TypeScript project with `mcp-cli` as the entry point. Bundle the initial `catalog.json` (with at least 3 starter entries: a no-auth mock server, an API-key server, and an OAuth server schema). Implement `mcp-cli tools list --json` which reads the catalog from disk and outputs all servers and their tool schemas.

- CLI entry point that handles `tools list`, `--help`, `--version`
- `catalog.json` bundled with the binary (copied to `~/.mcp-cli/` on first run)
- `mcp-cli tools list --json` output matches the schema defined in `ARCHITECTURE.md`
- `mcp-cli --help` prints usage
- `mcp-cli --version` prints version

## Acceptance criteria

- [ ] Running `mcp-cli tools list --json` returns valid JSON with server entries
- [ ] Running `mcp-cli --help` prints help text and exits 0
- [ ] Running `mcp-cli --version` prints a version string and exits 0
- [ ] Running with unknown command exits non-zero with error JSON
- [ ] `~/.mcp-cli/catalog.json` is created on first run if missing
- [ ] Test: assert JSON output shape of `tools list` matches expected schema

## Blocked by

None — can start immediately
