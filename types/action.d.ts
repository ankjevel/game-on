import { ActionRunning, Group, User, NewAction } from 'dataStore'

export type Message = {
  actionID: ActionRunning['id']
  groupID: Group['id']
  userID: User['id']
  newAction: NewAction
}
