import v8 from 'v8'

const { deserialize, serialize } = v8 as any

export const clone = <T>(object: T): T => deserialize(serialize(object))

export default clone
