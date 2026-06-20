Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Parse `--param value` CLI arguments against the tool's `inputSchema` from the `tools/list` response. Support all common JSON Schema types: string, number, integer, boolean, array, object. Handle booleans as flags (`--verbose` sets true), arrays as JSON strings (`--items "[1,2,3]"`), objects as JSON strings (`--filter '{"k":"v"}'`). If validation fails, return a descriptive error.

- Map `--param value` to tool's `inputSchema.properties`
- Type coercion: string, number, integer, boolean
- Array support: parse JSON string argument
- Object support: parse JSON string argument
- Boolean flags: `--flag` sets true, `--flag false` sets false
- Required param missing → error with `validation_error` code
- Unknown param → error with `unknown_param` code

## Acceptance criteria

- [ ] `--name "hello"` maps to `{name: "hello"}` for string property
- [ ] `--count 5` maps to `{count: 5}` for integer property
- [ ] `--enabled` maps to `{enabled: true}` for boolean property
- [ ] `--items "[1,2,3]"` maps to `{items: [1,2,3]}` for array property
- [ ] `--filter '{"status":"open"}'` maps to `{filter: {status: "open"}}` for object property
- [ ] Missing required param → error JSON with `validation_error`
- [ ] Unknown param → error JSON with `unknown_param`
- [ ] Test: run against a mock server that echoes back args, assert correct mapping

## Blocked by

- GH #2 (#02 Core tool call loop)
