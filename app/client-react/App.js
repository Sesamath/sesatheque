import {ConnectedRouter} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import {withContext} from 'recompose'
import Account from './components/Account'
import AutocompleteForm from './components/AutocompleteForm'
import Header from './components/Header'
import Home from './components/Home'
import Footer from './components/Footer'
import Description from './components/Description'
import MentionsLegales from './components/MentionsLegales'
import Preview from './components/Preview'
import InitApp from './components/InitApp'
import ResourceCreate from './components/ResourceCreate'
import ResourceForm from './components/ResourceForm'
import ResourceSearch from './components/ResourceSearch'
import Notifications from './components/Notifications'
import GroupesPerso from './components/groupes/GroupesPerso'
import GroupeEdition from './components/groupes/GroupeEdition'
import GroupesOuverts from './components/groupes/GroupesOuverts'
import GroupesPublics from './components/groupes/GroupesPublics'
import NotFound from './components/NotFound'
import ErrorBoundary from './components/ErrorBoundary'
import isIframeLayout from './utils/isIframeLayout'
import history from './history'
import store from './store'

import './App.scss'

const beforeSend = (report) => {
  if (/^file:\/\//.test(report.request.url)) return false
  report.metaData.state = store.getState()
}

// ATTENTION à garder la liste des routes synchrones dans app/server/main/controllerMain.js

const App = () => (
  <ErrorBoundary beforeSend={beforeSend}>
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Fragment>
          <InitApp />
          <Header />
          <div id="main">
            <Notifications />
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/autocomplete" component={AutocompleteForm} />
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
              <Route component={NotFound} />
            </Switch>
          </div>
          <Footer />
        </Fragment>
      </ConnectedRouter>
    </Provider>
  </ErrorBoundary>
)

const contextPropTypes = {
  isIframeLayout: PropTypes.bool
}

const getContext = () => ({isIframeLayout})

export default hot(module)(
  withContext(contextPropTypes, getContext)(
    App
  )
)
