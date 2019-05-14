import {routerMiddleware} from 'connected-react-router'
import {applyMiddleware, compose, createStore} from 'redux'
import thunkMiddleware from 'redux-thunk'
import history from './history'
import createRootReducer from './reducers'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(
  createRootReducer(history),
  composeEnhancers(applyMiddleware(
    routerMiddleware(history),
    thunkMiddleware
  ))
)

export default store
