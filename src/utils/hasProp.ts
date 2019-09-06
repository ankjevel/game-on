export const hasProp = <T>(object: any, prop: string): object is T =>
  Object.prototype.hasOwnProperty.call(object, prop)

export default hasProp
