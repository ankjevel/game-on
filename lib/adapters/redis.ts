import IORedis, { Redis } from 'ioredis'
import { redis as redisConfig } from '../config'

export default (): Redis => {
	let client: Redis
	try {
		client = new IORedis(redisConfig)

		client.on('error', error => {
			console.error(error)
			if (!error || !error.code) {
				return
			}
			if (error.code === 'ECONNREFUSED') {
				process.exit(1)
			}
		})
	} catch (error) {
		console.error(error)
		return process.exit(1)
	}

	return client
}
