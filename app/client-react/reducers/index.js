import { combineReducers } from 'redux'
import { reducer as form } from 'redux-form'
import notifications from './notifications'
import ressource from './ressource'

const reducer = combineReducers({
  form,
  notifications,
  ressource
})

export default reducer
