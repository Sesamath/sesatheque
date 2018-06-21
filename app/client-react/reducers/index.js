import { combineReducers } from 'redux'
import { reducer as form } from 'redux-form'
import notifications from './notifications'
import personne from './personne'

const reducer = combineReducers({
  form,
  notifications,
  personne
})

export default reducer
