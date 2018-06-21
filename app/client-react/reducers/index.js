import { combineReducers } from 'redux'
import { reducer as form } from 'redux-form'
import notifications from './notifications'
import personne from './personne'
import ressource from './ressource'

const reducer = combineReducers({
  form,
  notifications,
  personne,
  ressource
})

export default reducer
