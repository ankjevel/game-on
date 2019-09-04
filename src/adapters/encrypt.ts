import aes from '@iteam/encrypt'
import { encryption } from '../config'

export const variable = aes.init({
  password: encryption.variable,
  encoding: 'base64',
  algorithm: 'AES-256-CBC',
})

export const predictable = aes.init({
  password: encryption.predictable,
  encoding: 'base64',
  algorithm: 'AES-256-CBC',
  iv: Buffer.alloc(16),
})

export default {
  encrypt: variable.encrypt,
  decrypt: variable.decrypt,
  encryptPredictably: predictable.encrypt,
  decryptPredictably: predictable.decrypt,
}
