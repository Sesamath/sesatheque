import { combineReducers } from 'redux'
import { reducer as form } from 'redux-form'
import notifications from './notifications'
import session from './session'
import ressource from './ressource'
import groupes from './groupes'

const reducer = combineReducers({
  form,
  notifications,
  session,
  ressource,
  groupes
})

export default reducer
