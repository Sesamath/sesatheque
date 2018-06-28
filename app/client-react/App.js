import { ConnectedRouter } from 'connected-react-router'
import React, {Fragment} from 'react'
import {Provider} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import Header from './components/Header'
import Home from './components/Home'
import Footer from './components/Footer'
import Description from './components/Description'
import MentionsLegales from './components/MentionsLegales'
import Preview from './components/Preview'
import RessourceCreate from './components/RessourceCreate'
import SearchForm from './components/SearchForm'
import ResourceForm from './components/ResourceForm'
import Notifications from './components/Notifications'
import {getCurrentSession} from './actions/session'
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
            <Route exact path="/mentionsLegales" component={MentionsLegales} />
            <Route exact path="/ressource/ajouter" component={RessourceCreate} />
            <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
            <Route exact path="/ressource/apercevoir/:ressourceOid" component={Preview} />
            <Route exact path="/ressource/decrire/:ressourceOid" component={Description} />
            <Route exact path="/ressource/rechercher" component={SearchForm} />
          </Switch>
        </div>
        <Footer />
      </Fragment>
    </ConnectedRouter>
  </Provider>
)

export default App
