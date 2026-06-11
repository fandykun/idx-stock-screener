import { randomUUID } from 'node:crypto'

export interface AuthUser {
  id: string
  email: string
  passwordHash: string
}

export interface CreateAuthUserInput {
  email: string
  passwordHash: string
}

export interface AuthStore {
  createUser(input: CreateAuthUserInput): Promise<AuthUser>
  findByEmail(email: string): Promise<AuthUser | null>
}

export class DuplicateEmailError extends Error {
  readonly statusCode = 409

  constructor() {
    super('Email is already registered')
  }
}

export class InMemoryAuthStore implements AuthStore {
  private readonly usersByEmail = new Map<string, AuthUser>()

  async createUser(input: CreateAuthUserInput): Promise<AuthUser> {
    if (this.usersByEmail.has(input.email)) {
      throw new DuplicateEmailError()
    }

    const user: AuthUser = { id: randomUUID(), email: input.email, passwordHash: input.passwordHash }
    this.usersByEmail.set(user.email, user)
    return user
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.usersByEmail.get(email) ?? null
  }
}

export const defaultAuthStore = new InMemoryAuthStore()
