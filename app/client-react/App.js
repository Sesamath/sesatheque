import React from 'react'
import {Provider} from 'react-redux'
import MetaForm from './components/MetaForm'
import store from './store'

const App = () => (
  <Provider store={store}>
    <MetaForm />
  </Provider>
)

export default App
