Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Structured output formatting with three modes: human-friendly (default, colored terminal output), JSON (machine-parseable for agents), and error JSON (consistent error shape). Add `--verbose` (debug tracing to stderr) and `--log-file <path>` (write full trace to file).

- Human mode: colored output with checkmarks, tables, formatted text
- JSON mode (`--json`): `{ "success": true/false, "server": "...", "tool": "...", "duration_ms": 123, "data": ... }`
- Error JSON: `{ "success": false, "error": { "code": "...", "type": "...", "message": "..." } }`
- `--verbose`: print protocol-level traces to stderr (JSON-RPC messages, connection state)
- `--log-file <path>`: append full debug log to specified file, regardless of `--verbose`
- Progress messages go to stderr (not stdout), so JSON mode stderr stays clean

## Acceptance criteria

- [ ] Human mode: colored output, readable formatting
- [ ] JSON mode: valid JSON with `success`, `server`, `tool`, `data` fields
- [ ] Error mode: valid JSON with `success: false` and `error.code`, `error.message`
- [ ] `--verbose`: debug traces appear on stderr
- [ ] `--log-file path/to/log`: log file is written with full trace
- [ ] Test: compare stdout and stderr output with and without flags

## Blocked by

- GH #2 (#02 Core tool call loop)
