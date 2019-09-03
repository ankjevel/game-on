export type Express = { port: number; hostname: string }
export type LockExpire = number
export type PackageJSON = { name: string; version: string }
export type Redis = { host: string; port: number }
export type JWT = { expire: string; secret: string }

export type Config = {
  express: Express
  lockExpire: LockExpire
  packageJSON: PackageJSON
  redis: Redis
  jwt: JWT
}

export default Config
