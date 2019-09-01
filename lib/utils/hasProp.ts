export const hasProp = (object: any, prop: string) =>
  Object.prototype.hasOwnProperty.call(object, prop)

export default hasProp
