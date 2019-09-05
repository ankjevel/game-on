import * as dataStoreTypes from '../../types/dataStore'

const client = {
  get: jest.fn(),
  set: jest.fn(),
  keys: jest.fn(),
}

const uuid = 'cb2a9f62-79c3-443c-b755-f53b5327634b'

import * as userService from '../user'

jest.mock('../../adapters/redis', () => () => client)
jest.mock('uuid', () => ({ v4: () => uuid }))
jest.mock('../user')
jest.mock('../../types/dataStore')

import * as service from '../dataStore'

let userMock: { checkDuplicate: jest.Mock }
let dstMock: {
  [key: string]: jest.Mock
}
beforeEach(() => {
  userMock = userService as any
  dstMock = dataStoreTypes as any
})

describe('#newId', () => {
  it('returns the expected id', () => {
    expect(service.newId(service.StoreTypes.Action)).toEqual(`action:${uuid}`)
    expect(service.newId(service.StoreTypes.Group)).toEqual(`group:${uuid}`)
    expect(service.newId(service.StoreTypes.User)).toEqual(`user:${uuid}`)
  })
})

describe('#stripTag', () => {
  it('returns only the id withouth the type', () => {
    expect(service.stripTag(`action:${uuid}`)).toEqual(uuid)
    expect(service.stripTag(`group:${uuid}`)).toEqual(uuid)
    expect(service.stripTag(`user:${uuid}`)).toEqual(uuid)
  })
})

describe('#checkDuplicate', () => {
  it('calls the correct function to check for duplicates', async () => {
    const input = 'foo' as any

    dstMock.isAction.mockReturnValueOnce(true)

    expect(await service.checkDuplicate(input)).toBeUndefined()
    // should call duplicate on action

    dstMock.isAction.mockReturnValueOnce(false)
    dstMock.isGroup.mockReturnValueOnce(true)

    expect(await service.checkDuplicate(input)).toBeUndefined()
    // should call duplicate on group

    dstMock.isAction.mockReturnValueOnce(false)
    dstMock.isGroup.mockReturnValueOnce(false)
    dstMock.isUser.mockReturnValueOnce(true)

    userMock.checkDuplicate.mockReturnValueOnce(true)

    expect(await service.checkDuplicate(input)).toEqual(true)
    expect(userMock.checkDuplicate).toBeCalledWith(input)
  })
})

describe('#all', () => {
  it('returs every key with given prefix', async () => {
    client.keys.mockImplementation((input: string) => {
      if (input.includes('action')) {
        return ['action']
      }

      if (input.includes('group')) {
        return ['group']
      }

      if (input.includes('user')) {
        return ['user']
      }

      return []
    })

    expect(await service.all(service.StoreTypes.Action)).toEqual(['action'])
    expect(client.keys).lastCalledWith('action:*')

    expect(await service.all(service.StoreTypes.Group)).toEqual(['group'])
    expect(client.keys).lastCalledWith('group:*')

    expect(await service.all(service.StoreTypes.User)).toEqual(['user'])
    expect(client.keys).lastCalledWith('user:*')
  })
})

describe('#create', () => {
  test.todo('test me')
})
describe('#get', () => {
  test.todo('test me')
})
describe('#getWrapper', () => {
  test.todo('test me')
})
describe('#update', () => {
  test.todo('test me')
})
