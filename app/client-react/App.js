import {ConnectedRouter} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import {withContext, lifecycle} from 'recompose'
import Account from './components/Account'
import Header from './components/Header'
import Home from './components/Home'
import Footer from './components/Footer'
import Description from './components/Description'
import MentionsLegales from './components/MentionsLegales'
import Preview from './components/Preview'
import QueryError from './components/QueryError'
import ResourceCreate from './components/ResourceCreate'
import ResourceForm from './components/ResourceForm'
import ResourceSearch from './components/ResourceSearch'
import Notifications from './components/Notifications'
import GroupesPerso from './components/groupes/GroupesPerso'
import GroupeEdition from './components/groupes/GroupeEdition'
import GroupesOuverts from './components/groupes/GroupesOuverts'
import GroupesPublics from './components/groupes/GroupesPublics'
import {getCurrentSession} from './actions/session'
import isIframeLayout from './utils/isIframeLayout'
import history from './history'
import store from './store'
// cf webpackConfigLoader.js pour les valeurs exportées à un browser
import {baseId, baseUrl, sesatheques} from '../server/config'
import {addSesatheque} from 'sesatheque-client/src/sesatheques'

import './App.scss'

// init de cette sesatheque et des autres pour sesatheque-client
addSesatheque(baseId, baseUrl)
if (sesatheques.length) sesatheques.forEach(({baseId, baseUrl}) => addSesatheque(baseId, baseUrl))

// ATTENTION à garder la liste des routes synchrones dans app/server/main/controllerMain.js

const App = () => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Fragment>
        <QueryError />
        <Header />
        <div id="main">
          <Notifications />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/compte" component={Account} />
            <Route exact path="/mentionsLegales" component={MentionsLegales} />
            <Route exact path="/ressource/ajouter" component={ResourceCreate} />
            <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
            <Route exact path="/ressource/apercevoir/:ressourceOid" component={Preview} />
            <Route exact path="/ressource/decrire/:ressourceOid" component={Description} />
            <Route exact path="/ressource/rechercher" component={ResourceSearch} />
            <Route exact path="/groupe/ajouter" component={GroupeEdition} />
            <Route exact path="/groupe/editer/:groupe" component={GroupeEdition} />
            <Route exact path="/groupes/perso" component={GroupesPerso} />
            <Route exact path="/groupes/ouverts" component={GroupesOuverts} />
            <Route exact path="/groupes/publics" component={GroupesPublics} />
          </Switch>
        </div>
        <Footer />
      </Fragment>
    </ConnectedRouter>
  </Provider>
)

const contextPropTypes = {
  isIframeLayout: PropTypes.bool
}

const getContext = () => ({isIframeLayout})

export default hot(module)(
  withContext(contextPropTypes, getContext)(
    lifecycle({
      componentDidMount () {
        store.dispatch(getCurrentSession())
      }
    })(App)
  )
)
