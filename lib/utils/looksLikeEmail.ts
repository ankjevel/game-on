export default (input?: string) => {
  if (input == null) {
    return false
  }

  return input.match(/[\w\d]{2,}?@[\w\d].+?\.\w{2,}$/i) != null
}
