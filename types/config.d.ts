export type Debug = boolean
export type Encryption = { variable: string; predictable: string }
export type Express = { port: number; hostname: string }
export type JWT = { expire: string; secret: string }
export type LockExpire = number
export type PackageJSON = { name: string; version: string }
export type Redis = { host: string; port: number }

export type Config = {
  debug: Debug
  encryption: Encryption
  express: Express
  jwt: JWT
  lockExpire: LockExpire
  packageJSON: PackageJSON
  redis: Redis
}

export default Config
