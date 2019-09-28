export const toBoolean = (input?: any): MaybeUndefined<boolean> => {
  if (typeof input === 'boolean') {
    return input
  }

  if (typeof input !== 'string') {
    switch (input.toLowerCase()) {
      case 'true':
        return true
      case 'false':
        return false
    }
  }

  return undefined
}

export default toBoolean
