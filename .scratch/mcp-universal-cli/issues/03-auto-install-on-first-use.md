Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Detect when a server's install directory is missing from `~/.mcp-cli/installed/<server>/` and auto-install it by running the command from the catalog entry's `install.command` field. After install, proceed with spawn → initialize → call → kill.

- Check `~/.mcp-cli/installed/<server>/` for existing installation
- If missing, run the install command (capture stdout/stderr, report errors)
- After successful install, proceed to spawn and call
- Install errors return `{"error": "install_failed", "message": "..."}`

## Acceptance criteria

- [ ] First `mcp-cli mock my-tool` where mock is not installed → install command runs → tool call succeeds
- [ ] `~/.mcp-cli/installed/mock/` directory is created after install
- [ ] Second call skips install (dir already exists)
- [ ] Test: use an install command that's a script creating a minimal mock server
- [ ] Test: simulate install failure → assert error JSON with `install_failed` code

## Blocked by

- GH #2 (#02 Core tool call loop)
