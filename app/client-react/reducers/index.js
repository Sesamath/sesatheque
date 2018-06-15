import { combineReducers } from 'redux'
import personne from './personne'
import {reducer as reduxFormReducer} from 'redux-form'

export default combineReducers({
  form: reduxFormReducer,
  personne
})
