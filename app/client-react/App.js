import React from 'react'
import {Provider} from 'react-redux'
import {Route, BrowserRouter, Switch} from 'react-router-dom'
import ResourceForm from './components/ResourceForm'
import Description from './components/Description'
import store from './store'

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Switch>
        <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
        <Route exact path="/ressource/decrire/:ressourceOid" component={Description} />
      </Switch>
    </BrowserRouter>
  </Provider>
)

export default App
