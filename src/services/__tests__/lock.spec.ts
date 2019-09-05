const client = {
  setnx: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
}
const uuid = '132b7ae0-1839-4acb-8f86-885496677998'
const config = {
  lockExpire: 10,
}
jest.mock('../../adapters/redis', () => () => client)
jest.mock('uuid', () => ({
  v4: () => uuid,
}))
jest.mock('../../config', () => config)

import * as service from '../lock'

describe('#lock', () => {
  it('calls expire if setnx returns 1', async () => {
    client.setnx.mockResolvedValue(1)

    const lockSet = await service.lock('foo', 1337)

    expect(lockSet).toEqual(true)
    expect(client.setnx).toBeCalledWith('lock:foo', uuid)
    expect(client.expire).toBeCalledWith('lock:foo', 1337)
  })

  it('does not call expire if setnx returns 0', async () => {
    client.setnx.mockResolvedValue(0)

    const lockSet = await service.lock('foo', 1337)

    expect(lockSet).toEqual(false)
    expect(client.setnx).toBeCalledWith('lock:foo', uuid)
    expect(client.expire).not.toBeCalled()
  })

  it('handles the expire-value correctly', async () => {
    const id = 'foo'
    const lockKey = `lock:${id}`
    client.setnx.mockResolvedValue(1)

    await service.lock(id)

    expect(client.expire, 'using default expire').nthCalledWith(
      1,
      lockKey,
      config.lockExpire
    )

    await service.lock(id, 0)

    expect(
      client.expire,
      'dont call client.expire if expire > 0'
    ).toBeCalledTimes(1)
  })
})

describe('#unlock', () => {
  it('deletes the lock-key', async () => {
    await service.unlock('foo')

    expect(client.del).toBeCalledWith('lock:foo')
  })
})
