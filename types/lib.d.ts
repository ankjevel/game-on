declare module '@iteam/encrypt' {
  interface Options {
    password?: string
    encoding?: string
    algorithm?: 'aes-256-cbc' | string
    iv?: false | Buffer
    authTag?: false | Buffer
  }

  interface InitReturn {
    encrypt: (text: string, options?: Options) => string | Buffer
    decrypt: (encrypted: string) => string
  }

  export function init(options: Options | string): InitReturn

  export function encrypt(text: string, options: Options): string | Buffer

  export function decrypt(encrypted: string, password: string): string

  export function serialize(
    obj: Options,
    encoding?: 'base64' | string
  ): string | Buffer

  export function deserialize(
    content: string | Buffer,
    encoding?: 'base64' | string
  ): string | Buffer
}

declare type WithOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>

declare type MaybeNull<T> = T | null
