import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

const loginSchema = z.object({ password: z.string().min(1) })

function safeEqual(a: string, b: string) {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Введите пароль' })
  }

  const { adminPassword } = useRuntimeConfig()

  if (!safeEqual(parsed.data.password, adminPassword)) {
    console.warn('[admin/login] 401 invalid password attempt')
    throw createError({ statusCode: 401, statusMessage: 'Неверный пароль' })
  }

  const session = await useAdminSession(event)
  await session.update({ authenticated: true })

  return { ok: true }
})
