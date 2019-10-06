import { ActionRunningWithSidePot, Message } from 'action'
import {
  UserWithOutPassword,
  Group,
  ActionRunning,
  NewAction,
  NewActionEnum,
} from 'dataStore'

import * as dataStore from '../dataStore'
import * as drawFixture from '../__fixtures__/draw.fixture'
import * as betFoldAllInFixture from '../__fixtures__/bet-fold-all-in.fixture'

jest.mock('../dataStore')
jest.mock('../session')
jest.mock('../messageListener')
jest.mock('../../adapters/redis', () => () => jest.fn())

import * as actionService from '../action'
import { clone } from '../../utils'
import { sortHands } from '../cards'

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

describe('#handleConfirmation', () => {
  beforeEach(() => {
    action = clone(drawFixture.action)
    users = clone(drawFixture.users)
    group = clone(drawFixture.group)
  })

  const newAction = (type: NewActionEnum, userID: string = users[0].id) => ({
    newAction: { type },
    userID,
    groupID: group.id,
    actionID: action.id,
  })

  it('only allows calls with `confirm` or `forceConfirmAll`', async () => {
    const userID = users[0].id
    const handleEndRound = jest.spyOn(actionService, 'handleEndRound')

    dataStoreMock.update.mockResolvedValue(null)
    handleEndRound.mockResolvedValue()

    for (const type of [
      'none',
      'bet',
      'check',
      'call',
      'raise',
      'allIn',
      'fold',
      'back',
      'bank',
      'join',
      'leave',
      'sittingOut',
    ] as NewAction['type'][]) {
      await actionService.handleConfirmation(
        action,
        group,
        newAction(type, userID)
      )

      expect(dataStoreMock.update).not.toBeCalled()
      expect(handleEndRound).not.toBeCalled()
    }

    expect(action).not.toEqual(
      expect.objectContaining({
        turn: expect.objectContaining({
          [userID]: expect.objectContaining({
            status: 'confirm',
          }),
        }),
      })
    )

    await actionService.handleConfirmation(
      action,
      group,
      newAction('confirm', userID)
    )

    expect(dataStoreMock.update).toBeCalled()
    expect(handleEndRound).not.toBeCalled()
    expect(dataStoreMock.update).toBeCalledWith(
      action.id,
      expect.objectContaining({
        turn: expect.objectContaining({
          [userID]: expect.objectContaining({
            status: 'confirm',
          }),
        }),
      }),
      'action:running'
    )

    dataStoreMock.update.mockRestore()

    await actionService.handleConfirmation(
      action,
      group,
      newAction('forceConfirmAll', group.owner)
    )

    expect(dataStoreMock.update).not.toBeCalled()
    expect(handleEndRound).toBeCalled()
  })
})

describe('#handleEndRoundWithSidePot', () => {
  beforeEach(() => {
    action = clone(drawFixture.action)
    users = clone(drawFixture.users)
    group = clone(drawFixture.group)
  })

  test('ALL should have the same amount', async () => {
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

  it('will not be a draw, if api decides (pair in 7 is not as high as kings)', async () => {
    action.winners = sortHands(action.turn)

    const resetAction = jest.spyOn(actionService, 'resetAction')

    expect(group.users.map(user => user.sum)).toEqual([140, 0, 0])

    resetAction.mockResolvedValue(true)

    await actionService.handleEndRoundWithSidePot(action as any, group)
    expect(resetAction).toBeCalledTimes(1)
    expect(resetAction.mock.calls[0][0]).toMatchSnapshot()

    expect(group.users.map(user => user.sum)).toEqual([140, 0, 280])
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
