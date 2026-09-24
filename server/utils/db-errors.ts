export function isUniqueViolation(err: unknown, constraint: string) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505' &&
    'constraint' in err &&
    (err as { constraint?: string }).constraint === constraint
  )
}

// pg's error detail looks like: Key (phone)=(+971501234567) already exists.
export function extractConflictingPhone(err: unknown): string | null {
  const detail = typeof err === 'object' && err !== null && 'detail' in err ? (err as { detail?: string }).detail : undefined
  const match = detail?.match(/\(phone\)=\(([^)]+)\)/)
  return match?.[1] ?? null
}

export class SlotCapacityError extends Error {}
