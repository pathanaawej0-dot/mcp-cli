import { readFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))

const BUNDLED_CATALOG_PATH = join(__dirname, '..', 'catalog', 'catalog.json')
const LOCAL_CATALOG_PATH = join(homedir(), '.mcp-cli', 'catalog.json')

interface CatalogEntry {
  name: string
  displayName: string
  description: string
  runtime: string
  install: { command: string; version: string }
  start: { command: string; env: Record<string, string> }
  auth: { type: string; [key: string]: unknown }
}

interface Catalog {
  version: number
  updated: string
  servers: CatalogEntry[]
  registries: string[]
}

function ensureCatalog(): void {
  if (!existsSync(LOCAL_CATALOG_PATH)) {
    mkdirSync(dirname(LOCAL_CATALOG_PATH), { recursive: true })
    copyFileSync(BUNDLED_CATALOG_PATH, LOCAL_CATALOG_PATH)
  }
}

function readCatalog(): Catalog {
  if (existsSync(LOCAL_CATALOG_PATH)) {
    return JSON.parse(readFileSync(LOCAL_CATALOG_PATH, 'utf-8'))
  }
  return JSON.parse(readFileSync(BUNDLED_CATALOG_PATH, 'utf-8'))
}

const HELP_TEXT = `Usage: mcp-cli <server>[:<instance>] <tool> [--param value...] [--json] [--verbose]

Global Commands:
  tools list [--json]              List all catalog servers and their tools
  catalog update                   Fetch latest catalog from remote registry
  update <server>                  Upgrade a specific server
  remove <server>[:<instance>]     Uninstall a server and remove its tokens
  add-custom <name> [--command ...] Register a custom MCP server

Flags:
  --json                           Output results as structured JSON
  --verbose                        Print debug/trace info to stderr
  --log-file <path>                Write detailed logs to a file
  --version                        Print version and exit
  --help                           Print this help and exit
`

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP_TEXT)
  process.exit(0)
}

if (args.includes('--version') || args.includes('-v')) {
  console.log(pkg.version)
  process.exit(0)
}

const command = args[0]

if (command === undefined) {
  console.log(HELP_TEXT)
  process.exit(0)
}

if (command !== 'tools') {
  const errorResponse = {
    success: false,
    error: {
      code: 'unknown_command',
      message: `Unknown command: ${command}`,
    },
  }
  console.log(JSON.stringify(errorResponse, null, 2))
  process.exit(1)
}

if (args[1] === 'list') {
  ensureCatalog()
  const catalog = readCatalog()
  const servers = catalog.servers.map((s) => ({
    name: s.name,
    displayName: s.displayName,
    status: 'not_installed' as const,
    version: s.install.version,
    tools: [] as never[],
  }))
  console.log(JSON.stringify({ servers }, null, 2))
  process.exit(0)
}
