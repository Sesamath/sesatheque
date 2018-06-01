import React from 'react'
import {Provider} from 'react-redux'
import {Route, BrowserRouter, Switch} from 'react-router-dom'
import ResourceForm from './components/ResourceForm'
import store from './store'

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Switch>
        <Route exact path="/ressource/modifier/:ressourceOid" component={ResourceForm} />
      </Switch>
    </BrowserRouter>
  </Provider>
)

export default App
