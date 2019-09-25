export const wait = (timeout = 1000) =>
  new Promise(resolve => setTimeout(() => resolve(), timeout))

export default wait
