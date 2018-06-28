import { ConnectedRouter } from 'connected-react-router'
import React, {Fragment} from 'react'
import {Provider} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import Description from './components/Description'
import Preview from './components/Preview'
import ResourceForm from './components/ResourceForm'
import Notifications from './components/Notifications'
import {getCurrentUser} from './actions/personne'
import history from './history'
import store from './store'

store.dispatch(getCurrentUser())

const App = () => (
  <Provider store={store}>
    <Fragment>
      <Notifications />
      <ConnectedRouter history={history}>
        <Switch>
          <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
          <Route exact path="/ressource/apercevoir/:ressourceOid" component={Preview} />
          <Route exact path="/ressource/decrire/:ressourceOid" component={Description} />
        </Switch>
      </ConnectedRouter>
    </Fragment>
  </Provider>
)

export default App
