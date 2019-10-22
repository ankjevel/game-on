const client = {
  get: jest.fn(),
  set: jest.fn(),
  keys: jest.fn(),
}

const uuid = 'cb2a9f62-79c3-443c-b755-f53b5327634b'

jest.mock('../messageListener')

import * as userService from '../user'

jest.mock('../../adapters/redis', () => () => client)
jest.mock('uuid', () => ({ v4: () => uuid }))
jest.mock('../user')

import * as service from '../dataStore'

let userMock: { checkDuplicate: jest.Mock }
beforeEach(() => {
  userMock = userService as any
})

describe('#newId', () => {
  it('returns the expected id', () => {
    expect(service.newId('action')).toEqual(`action:${uuid}`)
    expect(service.newId('group')).toEqual(`group:${uuid}`)
    expect(service.newId('user')).toEqual(`user:${uuid}`)
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
    const isAction = jest.spyOn(service, 'isAction')
    const isGroup = jest.spyOn(service, 'isGroup')
    const isUser = jest.spyOn(service, 'isUser')

    const input = 'foo' as any

    isAction.mockReturnValueOnce(true)

    expect(await service.checkDuplicate(input)).toBeUndefined()
    // should call duplicate on action

    isAction.mockReturnValueOnce(false)
    isGroup.mockReturnValueOnce(true)

    expect(await service.checkDuplicate(input)).toBeUndefined()
    // should call duplicate on group

    isAction.mockReturnValueOnce(false)
    isGroup.mockReturnValueOnce(false)
    isUser.mockReturnValueOnce(true)

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

    expect(await service.all('action')).toEqual(['action'])
    expect(client.keys).lastCalledWith('action:*')

    expect(await service.all('group')).toEqual(['group'])
    expect(client.keys).lastCalledWith('group:*')

    expect(await service.all('user')).toEqual(['user'])
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
