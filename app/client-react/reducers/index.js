import {connectRouter} from 'connected-react-router'
import {combineReducers} from 'redux'
import {reducer as form} from 'redux-form'
import notifications from './notifications'
import session from './session'
import ressource from './ressource'
import groupes from './groupes'

const createRootReducer = history => combineReducers({
  form,
  groupes,
  notifications,
  ressource,
  router: connectRouter(history),
  session
})

export default createRootReducer
