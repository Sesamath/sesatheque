import React from 'react'
import {Provider} from 'react-redux'
import {expect} from 'chai'
import ResourceList from '../../../app/client-react/components/ResourceList'
import {createStore} from 'redux'
import ressources from '../../fixtures/ressources.js'
import {MemoryRouter} from 'react-router'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import window from '../setup'

Enzyme.configure({adapter: new Adapter()})

const domElement = document.getElementById('app')
const mountOptions = {
  attachTo: domElement
}

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

describe('<ResourceList />', () => {
  before(() => { global.window = window })
  after(() => { delete global.window })

  const WrappedComponent = () => (
    <MemoryRouter>
      <Provider store={store}>
        <ResourceList
          {...props}
          handlePageClick={dummyFunction}
          refreshList={dummyFunction}
        />
      </Provider>
    </MemoryRouter>
  )

  it('renders ressources', () => {
    const component = mount(<WrappedComponent />, mountOptions)

    // Le tableau doit contenir nos ressources
    const tableBody = component.find('table tbody')
    expect(tableBody.children()).to.have.length(ressources.length)

    // La première ressource doit posséder 5 liens (les 3 read + modifier + supprimer)
    const firstResourceLinks = tableBody.childAt(0).find('.links')
    expect(firstResourceLinks.children()).to.have.length(5)

    // La seconde ressource doit posséder 4 liens (La base + supprimer)
    const secondResourceLinks = tableBody.childAt(1).find('.links')
    expect(secondResourceLinks.children()).to.have.length(4)
  })
})
