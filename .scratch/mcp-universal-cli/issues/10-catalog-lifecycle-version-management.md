Status: ready-for-agent

## Parent

PRD: `.scratch/mcp-universal-cli/PRD.md`

## What to build

Catalog update lifecycle and server version management. Implement `mcp-cli catalog update` (fetch latest catalog from remote registry), `mcp-cli update <server>` (re-install server to pinned version), and `mcp-cli remove <server>` (uninstall + cleanup tokens and cache).

- `catalog update`: fetch from configured registries, merge, bump version, save
- `update <server>`: re-run install command for the server, clear its cache
- `remove <server>[:<instance>]`: delete install dir, auth file, cache file
- Version pinning: catalog entry has `"version"` field; `update` uses the pinned version
- Remote registry URL configured in catalog file under `"registries"`

## Acceptance criteria

- [ ] `mcp-cli catalog update` fetches from remote registry, updates local catalog.json
- [ ] `mcp-cli update slack` re-installs slack to catalog-pinned version, clears cache
- [ ] `mcp-cli remove slack` deletes install dir, auth file, cache
- [ ] `mcp-cli remove slack:work` removes only the named instance
- [ ] Test: mock HTTP registry returns updated catalog, assert local file changes
- [ ] Test: install → remove → assert all related files are gone

## Blocked by

- GH #3 (#03 Auto-install on first use)
