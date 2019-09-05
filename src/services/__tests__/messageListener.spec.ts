const utils = { wait: jest.fn() }
const lock = { lock: jest.fn(), unlock: jest.fn() }
const session = { popSession: jest.fn() }

jest.mock('../../utils', () => utils)
jest.mock('../lock', () => lock)
jest.mock('../session', () => session)

import * as service from '../messageListener'

beforeEach(() => {
  console.error = jest.fn()
  ;(jest.spyOn(process, 'exit') as any).mockImplementation(() => {})
})

describe('#messageListener', () => {
  test('test it', async () => {
    const channel = 'chanel'
    const listener = jest.fn()

    const breakError = new Error('unhandledError; just to break the loop')
    session.popSession.mockResolvedValueOnce(null)
    session.popSession.mockResolvedValueOnce('foo')

    lock.lock.mockResolvedValueOnce(false)
    lock.lock.mockResolvedValueOnce(false)
    lock.lock.mockResolvedValueOnce(true)

    await new Promise(resolve => {
      session.popSession.mockImplementationOnce(() => {
        resolve()
        throw breakError
      })

      service.messageListener(channel, listener)
    })

    expect(listener).toBeCalledWith('foo')

    expect(console.error).toBeCalledWith(breakError)

    expect(session.popSession).toBeCalledTimes(3)
    expect(session.popSession).toBeCalledWith(channel)
    expect(utils.wait).toBeCalledTimes(3)
    expect(utils.wait).nthCalledWith(1, 1000)
    expect(utils.wait).nthCalledWith(2, 100)
    expect(utils.wait).nthCalledWith(3, 100)
    expect(lock.lock).toBeCalledTimes(3)
    expect(lock.lock).toBeCalledWith(channel)
    expect(lock.unlock).toBeCalledTimes(1)
    expect(lock.unlock).toBeCalledWith(channel)
  })
})
