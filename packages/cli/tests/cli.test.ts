import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runCli, tempHome } from './helpers.js'

describe('mcp-cli --version', () => {
  it('prints a version string and exits 0', () => {
    const home = tempHome()
    const { stdout, exitCode } = runCli(['--version'], { HOME: home, USERPROFILE: home })

    expect(exitCode).toBe(0)
    expect(stdout).toMatch(/\d+\.\d+\.\d+/)
  })
})

describe('mcp-cli --help', () => {
  it('prints usage text and exits 0', () => {
    const home = tempHome()
    const { stdout, exitCode } = runCli(['--help'], { HOME: home, USERPROFILE: home })

    expect(exitCode).toBe(0)
    expect(stdout).toContain('Usage:')
    expect(stdout).toContain('mcp-cli')
  })
})

describe('mcp-cli unknown command', () => {
  it('exits non-zero with error JSON', () => {
    const home = tempHome()
    const { stdout, exitCode } = runCli(['foobar'], { HOME: home, USERPROFILE: home })

    expect(exitCode).not.toBe(0)

    const parsed = JSON.parse(stdout)
    expect(parsed.success).toBe(false)
    expect(parsed.error).toBeDefined()
    expect(parsed.error.code).toBeDefined()
  })
})

describe('mcp-cli tools list', () => {
  it('--json returns valid JSON with server entries matching schema', () => {
    const home = tempHome()
    const { stdout, exitCode } = runCli(['tools', 'list', '--json'], { HOME: home, USERPROFILE: home })

    expect(exitCode).toBe(0)

    const parsed = JSON.parse(stdout)
    expect(parsed.servers).toBeDefined()
    expect(Array.isArray(parsed.servers)).toBe(true)
    expect(parsed.servers.length).toBeGreaterThanOrEqual(3)

    const names = parsed.servers.map((s: any) => s.name)
    expect(names).toContain('mock')
    expect(names).toContain('brave-search')
    expect(names).toContain('slack')

    for (const server of parsed.servers) {
      expect(server.name).toBeDefined()
      expect(server.displayName).toBeDefined()
      expect(server.status).toBeDefined()
      expect(server.version).toBeDefined()
      expect(Array.isArray(server.tools)).toBe(true)
    }
  })
})

describe('mcp-cli catalog initialization', () => {
  it('creates ~/.mcp-cli/catalog.json on first run if missing', () => {
    const home = tempHome()
    const catalogPath = join(home, '.mcp-cli', 'catalog.json')

    expect(existsSync(catalogPath)).toBe(false)

    runCli(['tools', 'list', '--json'], { HOME: home, USERPROFILE: home })

    expect(existsSync(catalogPath)).toBe(true)

    const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'))
    expect(catalog.servers).toBeDefined()
    expect(catalog.servers.length).toBeGreaterThanOrEqual(3)
  })
})
