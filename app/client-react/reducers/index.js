import { combineReducers } from 'redux'
import { reducer as form } from 'redux-form'
import notifications from './notifications'

const reducer = combineReducers({
  form,
  notifications
})

export default reducer
