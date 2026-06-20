Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Before spawning a server, check that its required runtime (from catalog entry's `"runtime"` field) is available on `$PATH`. If missing, return a clear error with install instructions.

- Check runtime availability via `where <runtime>` (Windows) or `which <runtime>` (Unix)
- Support runtimes: `node`, `python`, `python3`, `go`, `docker`
- Error output: `{"error": "runtime_missing", "runtime": "node", "install_hint": "Download from https://nodejs.org/"}`
- Skip check if runtime is `none` or empty

## Acceptance criteria

- [ ] Server with `"runtime": "node"` and node on PATH → passes, server spawns
- [ ] Server with `"runtime": "nonexistent-runtime"` → error with `runtime_missing`
- [ ] Error JSON includes `install_hint` field
- [ ] Runtime check happens before install and before spawn
- [ ] Test: temporarily remove a runtime from PATH, assert error behavior
- [ ] Test: add runtime back, assert success

## Blocked by

- GH #3 (#03 Auto-install on first use)
