import * as Config from 'config'
import nconf from '@iteam/config'
import { name, version } from '../package.json'

const config = nconf({
  file: `${__dirname}/../config.json`,
  defaults: {
    express: { port: 5555, hostname: '' },
    lockExpire: 20,
    packageJSON: { name, version },
    redis: { host: '127.0.0.1', port: 6379 },
  },
})

export const express = config.get<Config.Express>('express')
export const lockExpire = config.get<Config.LockExpire>('lockExpire')
export const packageJSON = config.get<Config.PackageJSON>('packageJSON')
export const redis = config.get<Config.Redis>('redis')

export default {
  express,
  lockExpire,
  packageJSON,
  redis,
}
