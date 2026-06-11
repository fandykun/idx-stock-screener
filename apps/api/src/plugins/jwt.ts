import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

export interface AuthenticatedUser {
  userId: string
  email: string
}

export interface JwtPluginOptions {
  secret?: string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthenticatedUser
    user: AuthenticatedUser
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
}

const jwtPluginImplementation: FastifyPluginAsync<JwtPluginOptions> = async (app, options) => {
  const secret = options.secret ?? process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is required to register JWT authentication')
  }

  await app.register(fastifyJwt, { secret })

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      await request.jwtVerify()
    } catch (error) {
      return reply.send(error)
    }
  })
}

export const jwtPlugin = fp(jwtPluginImplementation, { name: 'jwt-plugin' })
