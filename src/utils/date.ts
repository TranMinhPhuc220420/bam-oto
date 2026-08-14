export function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }

  return null
}

export function toMillis(value: unknown) {
  return toDate(value)?.getTime() ?? 0
}
