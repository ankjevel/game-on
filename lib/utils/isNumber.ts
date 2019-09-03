export const isNumber = (input?: any): boolean => {
  if (typeof input === 'number') {
    return !isNaN(input)
  }

  if (typeof input !== 'string') {
    return false
  }

  return !isNaN(Number(input))
}

export default isNumber
