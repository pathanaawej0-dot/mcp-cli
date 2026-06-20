Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

The core MCP client loop: spawn a server process (stdio transport), perform `initialize` handshake, call `tools/list`, cache the response to disk (`~/.mcp-cli/cache/<server>-tools.json`), call `tools/call` with user-provided args, return the result to stdout, kill the server process.

For this slice, assume the server is already installed and requires no auth. Use a mock MCP server (a script that responds to JSON-RPC over stdio) for testing.

- MCP client using `@modelcontextprotocol/sdk` StdioClientTransport
- `tools/list` caching to `~/.mcp-cli/cache/<server>-tools.json`
- `tools/call` with raw JSON args (argument parsing comes in a later slice)
- Server process killed after tool call completes
- Output printed to stdout (human-friendly or JSON based on `--json` flag)

## Acceptance criteria

- [ ] `mcp-cli mock my-tool --json '{"param": "val"}'` spawns mock server, calls tool, returns JSON result
- [ ] `tools/list` cache file is created at `~/.mcp-cli/cache/mock-tools.json`
- [ ] Second call uses cached `tools/list` (no redundant handshake)
- [ ] Server process is killed after call completes
- [ ] Test: integration test with a mock server script that echoes back the received call
- [ ] Test: assert cache file content matches `tools/list` response

## Blocked by

- GH #1 (#01 Scaffold + catalog + `tools list`)
