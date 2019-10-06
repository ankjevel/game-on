import * as dataStore from '../dataStore'

jest.mock('../dataStore')

import * as group from '../group'

let ds: {
  [key: string]: jest.Mock
}

jest.mock('../../adapters/redis', () => () => jest.fn())

beforeEach(() => {
  ds = dataStore as any
  console.log = jest.fn()
})

describe('#startGame', () => {
  it('works', async () => {
    const id = 'foo'
    const userID = 'bar'
    const res = {
      id,
      owner: userID,
      turn: {},
      startSum: 200,
      blind: { small: 2, big: 4 },
      users: [{ id: userID }, { id: 'baz' }],
    }

    ds.get.mockResolvedValue(res)
    ds.update.mockResolvedValue(res)

    let action
    ds.create.mockImplementation((type, callback) => {
      action = callback(`${type}:6e002e4c-c194-42ab-aa15-f0aa6a8215e3`)
      return action
    })

    const game = await group.startGame({ id, userID })

    expect(game).toMatchSnapshot()
    expect(action).toMatchSnapshot()
  })
})

describe('#joinGroup', () => {
  test('join group limits', async () => {
    ds.all.mockResolvedValueOnce(['1'])
    ds.all.mockResolvedValueOnce(['2'])
    ds.all.mockResolvedValueOnce(['3'])
    ds.all.mockResolvedValueOnce(['4'])
    ds.all.mockResolvedValueOnce(['5'])
    ds.get.mockImplementation(req => {
      switch (req.id) {
        case '1':
          return { users: [{ id: userID }] }
        case '2':
          return { users: [], action: 'action is set' }
        case '3':
          return { users: [{ id: 'not-user-id' }] }
        case '4':
        case 'users-exists':
          return { users: [...Array(10)].map(() => ({ id: 'not-user-id' })) }
        case '5':
          return { users: [] }
        case 'action-set':
          return { users: [], action: 'action is set' }
        case 'success':
          return { users: [], startSum: 1337 }
      }
      return null
    })

    const userID = 'user-id'

    expect(
      await group.joinGroup({ id: 'group-1', userID }),
      'already in group'
    ).toBeNull()

    expect(
      await group.joinGroup({ id: 'none', userID }),
      'not in group, group does not exist'
    ).toBeNull()

    expect(
      await group.joinGroup({ id: 'action-set', userID }),
      'wont allow user to join, already has an action'
    ).toBeNull()

    expect(
      await group.joinGroup({ id: 'users-exists', userID }),
      'group is full'
    ).toBeNull()

    expect(await group.joinGroup({ id: 'success', userID }), 'should work!')
      .toMatchInlineSnapshot(`
      Object {
        "startSum": 1337,
        "users": Array [
          Object {
            "id": "user-id",
            "sum": 1337,
          },
        ],
      }
    `)
  })
})
