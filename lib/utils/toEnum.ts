export const toEnum = <T>(maybeType: any, maybeEnum: any): T | null => {
  if (maybeType == null) {
    return null
  }

  for (const [key, value] of Object.entries(maybeEnum)) {
    if (maybeType !== key && maybeType !== value) {
      continue
    }

    return maybeEnum[key]
  }

  return null
}

export default toEnum
