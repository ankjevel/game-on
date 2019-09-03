export default (input: any) =>
  input == null || typeof input !== 'string' || input.trim() === ''
