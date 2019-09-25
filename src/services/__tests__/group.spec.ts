import * as dataStore from '../dataStore'

jest.mock('../dataStore')

import * as group from '../group'

let ds: {
  [key: string]: jest.Mock
}

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
