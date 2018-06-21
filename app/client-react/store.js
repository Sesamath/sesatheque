import {applyMiddleware, compose, createStore} from 'redux'
import thunkMiddleware from 'redux-thunk'
import reducer from './reducers'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(reducer, composeEnhancers(applyMiddleware(thunkMiddleware)))

export default store
