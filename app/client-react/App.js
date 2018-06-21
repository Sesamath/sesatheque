import React, {Fragment} from 'react'
import {Provider} from 'react-redux'
import {Route, BrowserRouter, Switch} from 'react-router-dom'
import Preview from './components/Preview'
import ResourceForm from './components/ResourceForm'
import Notifications from './components/Notifications'
import {getCurrentUser} from './actions/personne'
import store from './store'

store.dispatch(getCurrentUser())

const App = () => (
  <Provider store={store}>
    <Fragment>
      <Notifications />
      <BrowserRouter>
        <Switch>
          <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
          <Route exact path="/ressource/apercevoir/:ressourceOid" component={Preview} />
        </Switch>
      </BrowserRouter>
    </Fragment>
  </Provider>
)

export default App
