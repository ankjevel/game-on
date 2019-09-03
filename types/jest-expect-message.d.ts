/* eslint-disable */
export {}
declare global {
  namespace jest {
    interface Expect {
      <T = any>(actual: T, message: string): Matchers<T>
    }
  }
}
