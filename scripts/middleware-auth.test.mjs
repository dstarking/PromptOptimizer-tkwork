import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const middlewareSource = await fs.readFile(path.join(process.cwd(), 'middleware.js'), 'utf8')
const middlewareModuleUrl = `data:text/javascript;base64,${Buffer.from(middlewareSource).toString('base64')}`
const { config, default: middleware } = await import(middlewareModuleUrl)

async function withAccessPassword(password, callback) {
  const previousValue = process.env.ACCESS_PASSWORD

  if (password === undefined) {
    delete process.env.ACCESS_PASSWORD
  } else {
    process.env.ACCESS_PASSWORD = password
  }

  try {
    await callback()
  } finally {
    if (previousValue === undefined) {
      delete process.env.ACCESS_PASSWORD
    } else {
      process.env.ACCESS_PASSWORD = previousValue
    }
  }
}

function matchesMiddleware(pathname) {
  return new RegExp(`^${config.matcher[0]}$`).test(pathname)
}

test('matcher sends every API path through middleware, including the auth endpoint', () => {
  assert.equal(matchesMiddleware('/api'), true)
  assert.equal(matchesMiddleware('/api/models'), true)
  assert.equal(matchesMiddleware('/api/auth'), true)
  assert.equal(matchesMiddleware('/api/authx'), true)
  assert.equal(matchesMiddleware('/api/authentic'), true)
})

test('middleware bypasses only the exact auth endpoint', async () => {
  await withAccessPassword('test-secret', async () => {
    assert.equal(middleware(new Request('https://example.com/api/auth')), undefined)

    for (const pathname of ['/api', '/api/models', '/api/auth/', '/api/authx', '/api/authentic']) {
      const response = middleware(new Request(`https://example.com${pathname}`))
      assert.equal(response?.status, 200, `${pathname} should require authentication`)
      assert.match(await response.text(), /Access Verification/)
    }
  })
})

test('middleware allows authenticated requests and deployments without a password', async () => {
  await withAccessPassword('test-secret', async () => {
    const authenticatedRequest = new Request('https://example.com/api/models', {
      headers: { cookie: 'vercel_access_token=test-secret' },
    })
    assert.equal(middleware(authenticatedRequest), undefined)
  })

  await withAccessPassword(undefined, async () => {
    assert.equal(middleware(new Request('https://example.com/api/models')), undefined)
  })
})
