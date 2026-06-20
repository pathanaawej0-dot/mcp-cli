import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const cliPath = fileURLToPath(new URL('../src/cli.ts', import.meta.url))

export interface CliResult {
  stdout: string
  stderr: string
  exitCode: number
}

export function runCli(args: string[] = [], env: Record<string, string> = {}): CliResult {
  const result = spawnSync(process.execPath, ['--import', 'tsx', cliPath, ...args], {
    encoding: 'utf-8',
    env: { ...process.env, ...env },
  })
  return {
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    exitCode: result.status ?? 1,
  }
}

export function tempHome(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-cli-test-'))
  return dir
}
