import {ConnectedRouter} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import {withContext, lifecycle} from 'recompose'
import Header from './components/Header'
import Home from './components/Home'
import Footer from './components/Footer'
import Description from './components/Description'
import MentionsLegales from './components/MentionsLegales'
import Preview from './components/Preview'
import RessourceCreate from './components/RessourceCreate'
import ResourceForm from './components/ResourceForm'
import ResourceSearch from './components/ResourceSearch'
import Notifications from './components/Notifications'
import Groupes from './components/Groupes'
import GroupeEdition from './components/GroupeEdition'
import GroupeDescription from './components/GroupeDescription'
import {getCurrentSession} from './actions/session'
import isIframeLayout from './utils/isIframeLayout'
import history from './history'
import store from './store'

import '../srcStyles/page.scss'

// ATTENTION à garder la liste des routes synchrones dans app/server/main/controllerMain.js

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
            <Route exact path="/ressource/rechercher" component={ResourceSearch} />
            <Route exact path="/groupe/perso" component={Groupes} />
            <Route exact path="/groupe/editer" component={GroupeEdition} />
            <Route exact path="/groupe/voir/:groupe" component={GroupeDescription} />
            <Route exact path="/groupe/editer/:groupe" component={GroupeEdition} />
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
