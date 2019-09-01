import hasProp from '../utils/hasProp'

export enum StoreTypes {
	Group = 'group',
	User = 'user',
}

export type Group = {
	id: string
	users: string[]
}

export const isGroup = (any: Group): any is Group =>
	hasProp(any, 'id') &&
	hasProp(any, 'users') &&
	typeof any.id === 'string' &&
	Array.isArray(any.users) &&
	any.users.every(value => typeof value === 'string')
