import { randomUUID } from 'node:crypto'

export interface AuthUser {
  id: string
  email: string
  passwordHash: string
}

export interface RefreshTokenRecord {
  tokenHash: string
  userId: string
  expiresAt: Date
}

export interface CreateAuthUserInput {
  email: string
  passwordHash: string
}

export interface CreateRefreshTokenInput {
  tokenHash: string
  userId: string
  expiresAt: Date
}

export interface AuthStore {
  createUser(input: CreateAuthUserInput): Promise<AuthUser>
  findByEmail(email: string): Promise<AuthUser | null>
  findById(id: string): Promise<AuthUser | null>
  saveRefreshToken(input: CreateRefreshTokenInput): Promise<void>
  consumeRefreshToken(tokenHash: string, now: Date): Promise<AuthUser | null>
  deleteRefreshToken(tokenHash: string): Promise<void>
}

export class DuplicateEmailError extends Error {
  readonly statusCode = 409

  constructor() {
    super('Email is already registered')
  }
}

export class InMemoryAuthStore implements AuthStore {
  private readonly usersByEmail = new Map<string, AuthUser>()
  private readonly usersById = new Map<string, AuthUser>()
  private readonly refreshTokensByHash = new Map<string, RefreshTokenRecord>()

  async createUser(input: CreateAuthUserInput): Promise<AuthUser> {
    if (this.usersByEmail.has(input.email)) {
      throw new DuplicateEmailError()
    }

    const user: AuthUser = { id: randomUUID(), email: input.email, passwordHash: input.passwordHash }
    this.usersByEmail.set(user.email, user)
    this.usersById.set(user.id, user)
    return user
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.usersByEmail.get(email) ?? null
  }

  async findById(id: string): Promise<AuthUser | null> {
    return this.usersById.get(id) ?? null
  }

  async saveRefreshToken(input: CreateRefreshTokenInput): Promise<void> {
    this.refreshTokensByHash.set(input.tokenHash, input)
  }

  async consumeRefreshToken(tokenHash: string, now: Date): Promise<AuthUser | null> {
    const record = this.refreshTokensByHash.get(tokenHash)
    if (!record) return null

    this.refreshTokensByHash.delete(tokenHash)
    if (record.expiresAt <= now) return null

    return this.findById(record.userId)
  }

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    this.refreshTokensByHash.delete(tokenHash)
  }
}

export const defaultAuthStore = new InMemoryAuthStore()
