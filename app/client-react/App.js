import React, {Fragment} from 'react'
import {Provider} from 'react-redux'
import {Route, BrowserRouter, Switch} from 'react-router-dom'
import ResourceForm from './components/ResourceForm'
import Notifications from './components/Notifications'
import store from './store'

const App = () => (
  <Provider store={store}>
    <Fragment>
      <Notifications />
      <BrowserRouter>
        <Switch>
          <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
        </Switch>
      </BrowserRouter>
    </Fragment>
  </Provider>
)

export default App
