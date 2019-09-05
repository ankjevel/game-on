import v8 from 'v8'

const { deserialize, serialize } = v8 as any

export default <T>(object: T): T => deserialize(serialize(object))
