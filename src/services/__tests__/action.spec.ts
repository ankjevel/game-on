import { ActionRunningWithSidePot } from 'action'
import { UserWithOutPassword, Group, NewAction } from 'dataStore'

// import * as dataStore from '../dataStore'
// import { pushSession } from '../session'
// import mainLoop from '../messageListener'
// import { newDeck, takeCards } from '../cards'

import * as fixture from '../__fixtures__/draw.fixture'

jest.mock('../dataStore')
jest.mock('../session')
jest.mock('../messageListener')
jest.mock('../cards')

import * as actionService from '../action'
import { clone } from '../../utils'

let action: ActionRunningWithSidePot
let users: UserWithOutPassword[]
let group: Group
beforeEach(() => {
  action = clone(fixture.action)
  users = clone(fixture.users)
  group = clone(fixture.group)
})

describe('#handleEndRoundWithSidePot', () => {
  test('ALL should have the same amount', async () => {
    const newAction: NewAction = {
      type: 'winner',
      order: [[users[2].id, users[0].id]],
    }

    const resetAction = jest.spyOn(actionService, 'resetAction')

    resetAction.mockResolvedValue(true)

    await actionService.handleEndRoundWithSidePot(action, group, newAction)
    expect(resetAction).toBeCalledTimes(1)
    expect(resetAction.mock.calls[0][0]).toMatchSnapshot()
  })
})
