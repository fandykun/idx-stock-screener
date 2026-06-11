import { createHash, randomBytes } from 'node:crypto'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { LoginSchema, RefreshSchema, RegisterSchema } from '@idx-screener/shared'
import type { AuthStore, AuthUser } from '../data/authStore.js'
import { DuplicateEmailError } from '../data/authStore.js'
import { hashPassword, verifyPassword } from '../lib/password.js'

const REFRESH_TOKEN_BYTES = 32
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface AuthRoutesOptions {
  authStore: AuthStore
}

export class InvalidCredentialsError extends Error {
  readonly statusCode = 401

  constructor() {
    super('Invalid email or password')
  }
}

export class InvalidRefreshTokenError extends Error {
  readonly statusCode = 401

  constructor() {
    super('Invalid refresh token')
  }
}

function hashRefreshToken(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex')
}

function createRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url')
}

async function issueTokenPair(app: FastifyInstance, authStore: AuthStore, user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = app.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '15m' })
  const refreshToken = createRefreshToken()
  await authStore.saveRefreshToken({
    tokenHash: hashRefreshToken(refreshToken),
    userId: user.id,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  })
  return { accessToken, refreshToken }
}

export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (app, options) => {
  app.post('/auth/register', async (request, reply) => {
    const input = RegisterSchema.parse(request.body)
    const passwordHash = await hashPassword(input.password)

    try {
      const user = await options.authStore.createUser({ email: input.email, passwordHash })
      return reply.status(201).send({ user: { id: user.id, email: user.email } })
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return reply.status(error.statusCode).send({ statusCode: error.statusCode, error: 'Conflict', message: error.message })
      }
      throw error
    }
  })

  app.post('/auth/login', async (request) => {
    const input = LoginSchema.parse(request.body)
    const user = await options.authStore.findByEmail(input.email)
    if (!user) {
      throw new InvalidCredentialsError()
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash)
    if (!passwordMatches) {
      throw new InvalidCredentialsError()
    }

    return issueTokenPair(app, options.authStore, user)
  })

  app.post('/auth/refresh', async (request) => {
    const input = RefreshSchema.parse(request.body)
    const user = await options.authStore.consumeRefreshToken(hashRefreshToken(input.refreshToken), new Date())
    if (!user) {
      throw new InvalidRefreshTokenError()
    }

    return issueTokenPair(app, options.authStore, user)
  })

  app.post('/auth/logout', async (request, reply) => {
    const input = RefreshSchema.parse(request.body)
    await options.authStore.deleteRefreshToken(hashRefreshToken(input.refreshToken))
    return reply.status(204).send()
  })
}
