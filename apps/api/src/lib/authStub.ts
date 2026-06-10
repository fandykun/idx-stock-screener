export interface HeaderCarrier {
  headers: Record<string, string | string[] | undefined>
}

export class AuthStubError extends Error {
  readonly statusCode = 401

  constructor() {
    super('X-User-Id header required in development')
  }
}

export function getStubUserId(request: HeaderCarrier): string {
  const userId = request.headers['x-user-id']
  if (!userId || typeof userId !== 'string') {
    throw new AuthStubError()
  }
  return userId
}
