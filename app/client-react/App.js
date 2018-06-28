import { ConnectedRouter } from 'connected-react-router'
import React, {Fragment} from 'react'
import {Provider} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import Header from './components/Header'
import Home from './components/Home'
import Footer from './components/Footer'
import Description from './components/Description'
import Preview from './components/Preview'
import ResourceForm from './components/ResourceForm'
import Notifications from './components/Notifications'
import {getCurrentSession} from './actions/personne'
import history from './history'
import store from './store'

store.dispatch(getCurrentSession())

const App = () => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Fragment>
        <Header />
        <div id="main">
          <Notifications />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
            <Route exact path="/ressource/apercevoir/:ressourceOid" component={Preview} />
            <Route exact path="/ressource/decrire/:ressourceOid" component={Description} />
          </Switch>
        </div>
        <Footer />
      </Fragment>
    </ConnectedRouter>
  </Provider>
)

export default App
