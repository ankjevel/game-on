export const fillConsoleWindow = (char: string) =>
  char.repeat(process.stdout.columns || 0)

export default fillConsoleWindow
