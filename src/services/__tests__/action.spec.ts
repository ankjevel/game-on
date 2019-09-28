import { ActionRunningWithSidePot, Message } from 'action'
import { UserWithOutPassword, Group, NewAction, ActionRunning } from 'dataStore'

import * as dataStore from '../dataStore'
// import { pushSession } from '../session'
// import mainLoop from '../messageListener'
// import { newDeck, takeCards } from '../cards'

import * as drawFixture from '../__fixtures__/draw.fixture'
import * as betFoldAllInFixture from '../__fixtures__/bet-fold-all-in.fixture'

jest.mock('../dataStore')
jest.mock('../session')
jest.mock('../messageListener')
// jest.mock('../cards')

import * as actionService from '../action'
import { clone } from '../../utils'

let action: ActionRunningWithSidePot | ActionRunning
let users: UserWithOutPassword[]
let group: Group

let dataStoreMock: {
  [key: string]: jest.Mock
}
beforeEach(() => {
  dataStoreMock = dataStore as any
  console.log = jest.fn()
  console.info = jest.fn()
})

describe('#handleEndRoundWithSidePot', () => {
  beforeEach(() => {
    action = clone(drawFixture.action)
    users = clone(drawFixture.users)
    group = clone(drawFixture.group)
  })

  test('ALL should have the same amount', async () => {
    const newAction: NewAction = {
      type: 'winner',
      order: [[users[2].id, users[0].id]],
    }

    const resetAction = jest.spyOn(actionService, 'resetAction')

    resetAction.mockResolvedValue(true)

    await actionService.handleEndRoundWithSidePot(
      action as ActionRunningWithSidePot,
      group,
      newAction
    )
    expect(resetAction).toBeCalledTimes(1)
    expect(resetAction.mock.calls[0][0]).toMatchSnapshot()
  })
})

describe('#handleUpdate', () => {
  beforeEach(() => {
    action = clone(betFoldAllInFixture.action)
    users = clone(betFoldAllInFixture.users)
    group = clone(betFoldAllInFixture.group)
  })

  it('should not end round', async () => {
    const message = {
      newAction: {
        type: 'allIn',
      },
      userID: 'user:f7fefb97-1cd6-4507-b312-611d157a65bf',
    } as Message

    const endRound = jest.spyOn(actionService, 'handleEndRound')

    endRound.mockRejectedValue('should not be called')

    await actionService.handleUpdate(action as ActionRunning, group, message)

    expect(endRound).not.toBeCalled()
    expect(dataStoreMock.update).toBeCalledTimes(2)

    expect(dataStoreMock.update.mock.calls).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([action.id, action, 'action:running']),
        expect.arrayContaining([group.id, group, 'group']),
      ])
    )

    expect(action).toMatchSnapshot()
    expect(group).toMatchSnapshot()
  })
})

describe('#getPlayer', () => {})
