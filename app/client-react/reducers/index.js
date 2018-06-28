import { combineReducers } from 'redux'
import { reducer as form } from 'redux-form'
import notifications from './notifications'
import session from './session'
import ressource from './ressource'

const reducer = combineReducers({
  form,
  notifications,
  session,
  ressource
})

export default reducer
