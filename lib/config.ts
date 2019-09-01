import nconf from '@iteam/config'
import { name, version } from '../package.json'

const config = nconf({
	file: `${__dirname}/../config.json`,
	defaults: {
		express: { port: 5555, hostname: '' },
		packageJSON: { name, version },
		redis: { host: '127.0.0.1', port: 6379 },
	},
})

export const express = config.get<{ port: number; hostname: string }>('express')
export const packageJSON = config.get<{ name: string; version: string }>('packageJSON')
export const redis = config.get<{ host: string; port: number }>('redis')

export default {
	express,
	packageJSON,
	redis,
}
