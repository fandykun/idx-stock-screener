#!/usr/bin/env node

import { spawn } from 'node:child_process'

const serviceName = process.env.RAILWAY_SERVICE_NAME?.toLowerCase()

function commandForService(name) {
  if (name === 'web') return ['corepack', ['pnpm', '--filter', 'web', 'start']]
  if (name === 'api' || name === undefined) return ['corepack', ['pnpm', '--filter', 'api', 'start']]

  throw new Error(`Unsupported RAILWAY_SERVICE_NAME "${process.env.RAILWAY_SERVICE_NAME}". Expected "api" or "web".`)
}

const [command, args] = commandForService(serviceName)

if (process.argv.includes('--print')) {
  console.log([command, ...args].join(' '))
  process.exit(0)
}

const child = spawn(command, args, {
  env: process.env,
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error(`Failed to start ${serviceName ?? 'api'} service: ${error.message}`)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Service ${serviceName ?? 'api'} exited from signal ${signal}`)
    process.exit(1)
  }

  process.exit(code ?? 1)
})
