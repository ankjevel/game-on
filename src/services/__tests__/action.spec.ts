import { ActionRunningWithSidePot, Message } from 'action'
import { UserWithOutPassword, Group, ActionRunning } from 'dataStore'

import * as dataStore from '../dataStore'
import * as drawFixture from '../__fixtures__/draw.fixture'
import * as betFoldAllInFixture from '../__fixtures__/bet-fold-all-in.fixture'

jest.mock('../dataStore')
jest.mock('../session')
jest.mock('../messageListener')

import * as actionService from '../action'
import { clone } from '../../utils'
import { checkHand } from '../cards'

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

  test.only('ALL should have the same amount', async () => {
    action.winners = [[users[2].id, users[0].id]]

    const resetAction = jest.spyOn(actionService, 'resetAction')

    expect(group.users.map(user => user.sum)).toEqual([140, 0, 0])

    resetAction.mockResolvedValue(true)

    await actionService.handleEndRoundWithSidePot(
      action as ActionRunningWithSidePot,
      group
    )
    expect(resetAction).toBeCalledTimes(1)
    expect(resetAction.mock.calls[0][0]).toMatchSnapshot()

    expect(group.users.map(user => user.sum)).toEqual([140, 140, 140])
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

    expect(action.round, 'starts at round 0').toEqual(0)

    await actionService.handleUpdate(action as ActionRunning, group, message)

    expect(action.round, 'still at round 0').toEqual(0)
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
