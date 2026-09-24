import type { H3Event } from 'h3'

interface AdminSessionData {
  authenticated?: boolean
}

export function useAdminSession(event: H3Event) {
  const { sessionSecret } = useRuntimeConfig()

  return useSession<AdminSessionData>(event, {
    name: 'admin_session',
    password: sessionSecret,
    maxAge: 60 * 60 * 12, // 12 часов
    cookie: { httpOnly: true, sameSite: 'lax' }
  })
}

export async function requireAdminSession(event: H3Event) {
  const session = await useAdminSession(event)

  if (!session.data.authenticated) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется вход в админку' })
  }

  return session
}
