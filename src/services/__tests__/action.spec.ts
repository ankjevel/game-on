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
import * as fourAllInFixture from '../__fixtures__/four-all-in.fixture'
import * as brokenGameFixture from '../__fixtures__/broken-game.fixture'

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
  // console.log = jest.fn()
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

    expect(action.pot).toEqual(280)
    expect(
      Object.values(action.turn).reduce((sum, turn) => sum + turn.bet, 0)
    ).toEqual(280)

    expect(group.users.map(user => user.sum)).toEqual([140, 0, 0])

    resetAction.mockResolvedValue(true)

    await actionService.handleEndRoundWithSidePot(
      action as ActionRunningWithSidePot,
      group
    )

    expect(group.users.map(user => user.sum)).toEqual([140, 140, 140])
    expect(action.pot).toEqual(0)

    expect(resetAction).toBeCalledTimes(1)
    expect(resetAction.mock.calls[0][0]).toMatchSnapshot()
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

  it('should split pots based on what players have in bank', async () => {
    action = clone(fourAllInFixture.action)
    users = clone(fourAllInFixture.users)
    group = clone(fourAllInFixture.group)

    const resetAction = jest.spyOn(actionService, 'resetAction')
    resetAction.mockResolvedValue(true)

    expect(group.users.map(user => user.sum)).toEqual([0, 0, 0, 0])

    await actionService.handleEndRoundWithSidePot(
      action as ActionRunningWithSidePot,
      group
    )

    /**
     * 187 * (4 eligible)
     *  = 748
     *    = one-winner: 748
     * (190 - 187) * (3 eligible)
     *  = 9
     *    = two-winners: 4.5
     *    = rounded: 4
     * (193 - 190) * (2 eligible)
     *  = 6
     *    = one winner: 6
     * (230 - 193) * (1 eligible)
     *  = 37
     *    = one winner: 37
     *
     * 04c4a68e = 748
     * f2028356 -> 4 (4.5) = 4
     * de4d9b93 -> 4 (4.5) + 6 = 10
     * b5aa24e7 = 37
     *
     * 748 + 4 + 10 + 37 = 799
     */
    expect(group.users.reduce((sum, user) => sum + user.sum, 0)).toEqual(799)
    expect(action.pot).toEqual(1)
    expect(group.users.map(user => user.sum)).toEqual(
      expect.arrayContaining([748, 4, 10, 37])
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

  describe('broken game', () => {
    beforeEach(() => {
      action = clone(brokenGameFixture.action)
      users = clone(brokenGameFixture.users)
      group = clone(brokenGameFixture.group)
    })

    it('should not break', async () => {
      const message = {
        newAction: { type: 'check' },
        userID: 'user:33510cde-e65d-4d7b-91ab-8de29db49af6',
      } as Message

      await actionService.handleUpdate(action, group, message)

      expect(action.winners).toMatchInlineSnapshot(`
        Array [
          Array [
            "user:ae95d3e8-bed7-48ee-b9ec-843eae17bb9e",
          ],
          Array [
            "user:0261a93a-fcf3-41ed-bfb3-b6ad606f484c",
          ],
          Array [
            "user:33510cde-e65d-4d7b-91ab-8de29db49af6",
          ],
        ]
      `)
    })
  })
})

describe('#getPlayer', () => {})
