export const nullOrEmpty = (input: any): input is null | '' | undefined =>
  input == null || typeof input !== 'string' || input.trim() === ''

export default nullOrEmpty
