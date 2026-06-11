import { z } from 'zod'

const EmailSchema = z.string().trim().toLowerCase().pipe(z.email())
const PasswordSchema = z.string().min(8).max(128)

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
})

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshInput = z.infer<typeof RefreshSchema>
