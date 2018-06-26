import React, {Fragment} from 'react'
import {Provider} from 'react-redux'
import {Route, BrowserRouter, Switch} from 'react-router-dom'
import Header from './components/Header'
import Description from './components/Description'
import Preview from './components/Preview'
import ResourceForm from './components/ResourceForm'
import Notifications from './components/Notifications'
import {getCurrentUser} from './actions/personne'
import store from './store'

store.dispatch(getCurrentUser())

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Fragment>
        <Header />
        <div id="main">
          <Notifications />
          <Switch>
            <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
            <Route exact path="/ressource/apercevoir/:ressourceOid" component={Preview} />
            <Route exact path="/ressource/decrire/:ressourceOid" component={Description} />
          </Switch>
        </div>
      </Fragment>
    </BrowserRouter>
  </Provider>
)

export default App
