export type Express = { port: number; hostname: string }
export type LockExpire = number
export type PackageJSON = { name: string; version: string }
export type Redis = { host: string; port: number }

export type Config = {
  express: Express
  lockExpire: LockExpire
  packageJSON: PackageJSON
  redis: Redis
}

export default Config
