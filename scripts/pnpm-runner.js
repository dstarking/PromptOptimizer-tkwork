const { spawn, spawnSync } = require('node:child_process')

function getPnpmRunnerSpec(platform = process.platform, env = process.env) {
  if (platform === 'win32') {
    return {
      command: env.ComSpec || env.COMSPEC || 'cmd.exe',
      argsPrefix: ['/d', '/s', '/c', 'pnpm'],
      shell: false,
    }
  }

  return {
    command: 'pnpm',
    argsPrefix: [],
    shell: false,
  }
}

function spawnPnpm(args, options = {}) {
  const { command, argsPrefix, shell } = getPnpmRunnerSpec()
  return spawn(command, [...argsPrefix, ...args], {
    shell,
    ...options,
  })
}

function spawnPnpmSync(args, options = {}) {
  const { command, argsPrefix, shell } = getPnpmRunnerSpec()
  return spawnSync(command, [...argsPrefix, ...args], {
    shell,
    ...options,
  })
}

module.exports = {
  getPnpmRunnerSpec,
  spawnPnpm,
  spawnPnpmSync,
}
