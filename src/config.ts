import * as Config from 'config'
import nconf from '@iteam/config'
import { name, version } from '../package.json'

const config = nconf({
  file: `${__dirname}/../config.json`,
  defaults: {
    debug: false,
    encryption: {
      variable: 'some key or something',
      predictable: 'some other key',
    },
    express: { port: 5555, hostname: '' },
    jwt: {
      expire: '1d',
      secret:
        '8e48cb15cc0c3b15239c6ed51d0f52b9c2a3fd1b62e025fa0edb78074085f89c',
    },
    lockExpire: 20,
    packageJSON: { name, version },
    redis: { host: '127.0.0.1', port: 6379 },
  },
})

export const debug = config.get<Config.Debug>('debug')
export const encryption = config.get<Config.Encryption>('encryption')
export const express = config.get<Config.Express>('express')
export const jwt = config.get<Config.JWT>('jwt')
export const lockExpire = config.get<Config.LockExpire>('lockExpire')
export const packageJSON = config.get<Config.PackageJSON>('packageJSON')
export const redis = config.get<Config.Redis>('redis')

export default {
  debug,
  encryption,
  express,
  jwt,
  lockExpire,
  packageJSON,
  redis,
}
