import React from 'react'
import {Provider} from 'react-redux'
import TestRenderer from 'react-test-renderer'
import {expect} from 'chai'
import {ResourceList} from '../../app/client-react/components/ResourceList'
import {createStore} from 'redux'
import ressources from '../fixtures/ressources.js'
// on défini window en global, mais seulement au runtime, on peut faire un require de app/server/config
// (qui throw si y'a du window)
import {application} from '../../app/server/config'
import {MemoryRouter} from 'react-router'

const route = '/ressource/rechercher'

const store = createStore(() => ({
  router: {
    location: {
      pathname: route,
      search: '',
      hash: ''
    }
  }
}))

const props = {
  resources: ressources,
  total: ressources.length,
  queryOptions: {
    skip: 0,
    limit: 10
  }
}
const dummyFunction = () => undefined

const fakeWindow = {location: {href: `${application.baseUrl}${route.substr(1)}`}}

describe('<ResourceList />', () => {
  const wrappedComponent =
    <MemoryRouter>
      <Provider store={store}>
        <ResourceList {...props} handlePageClick={dummyFunction} />
      </Provider>
    </MemoryRouter>

  const oldWindow = global.window
  before(() => { global.window = fakeWindow })
  after(() => { global.window = oldWindow })

  it('renders ressources', () => {
    const component = TestRenderer.create(wrappedComponent)

    // Le tableau doit contenir nos 2 ressources
    const tableBody = component.root.findByType('table').findByType('tbody')
    expect(tableBody.children).to.have.length(2)

    // La première ressource doit posséder 5 liens (La base + modifier + supprimer)
    const firstResource = tableBody.children[0].findByProps({className: 'links'})
    expect(firstResource.children).to.have.length(5)

    // La seconde ressource doit posséder 4 liens (La base + supprimer)
    const secondResource = tableBody.children[1].findByProps({className: 'links'})
    expect(secondResource.children).to.have.length(4)
  })
})
