import { randomBytes } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { LoginSchema, RegisterSchema } from '@idx-screener/shared'
import type { AuthStore } from '../data/authStore.js'
import { DuplicateEmailError } from '../data/authStore.js'
import { hashPassword, verifyPassword } from '../lib/password.js'

export interface AuthRoutesOptions {
  authStore: AuthStore
}

export class InvalidCredentialsError extends Error {
  readonly statusCode = 401

  constructor() {
    super('Invalid email or password')
  }
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

  app.post('/auth/login', async (request, reply) => {
    const input = LoginSchema.parse(request.body)
    const user = await options.authStore.findByEmail(input.email)
    if (!user) {
      throw new InvalidCredentialsError()
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash)
    if (!passwordMatches) {
      throw new InvalidCredentialsError()
    }

    const accessToken = app.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '15m' })
    const refreshToken = randomBytes(32).toString('base64url')
    return reply.send({ accessToken, refreshToken })
  })
}
