const client = {
  lpush: jest.fn(),
  rpop: jest.fn(),
  lrange: jest.fn(),
  del: jest.fn(),
}

jest.mock('../../adapters/redis', () => () => client)

import * as service from '../session'

beforeEach(() => {
  console.log = jest.fn()
})

describe('#pushSession', () => {
  it('pushes the message to given id', async () => {
    const channel = 'foo'
    const message = '["bar"]'
    await service.pushSession({ channel, message })

    expect(client.lpush).toBeCalledWith(`hold:${channel}`, message)
  })
})

describe('#popSession', () => {
  const channel = 'foo'

  it('removes the last element of the list', async () => {
    await service.popSession(channel)

    expect(client.rpop).toBeCalledWith(`hold:${channel}`)
  })

  it('returns null if not found', async () => {
    client.rpop.mockResolvedValueOnce('["bar"]')
    client.rpop.mockResolvedValueOnce(null)

    expect(await service.popSession(channel)).toEqual('["bar"]')
    expect(await service.popSession(channel)).toEqual(null)
  })
})

describe('#clear', () => {
  const channel = 'foo'

  it('gets all sessions saved and deletes the key', async () => {
    client.lrange.mockResolvedValue(['foo', 'bar'])

    expect(await service.clear(channel)).toEqual(['foo', 'bar'])

    expect(client.lrange).toBeCalledWith(`hold:${channel}`, 0, -1)
    expect(client.del).toBeCalledWith(`hold:${channel}`)
  })
})
