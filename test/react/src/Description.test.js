import React from 'react'
import {Provider} from 'react-redux'
import {expect} from 'chai'
import {Description} from '../../../app/client-react/components/Description'
import {createStore} from 'redux'
import ressources from '../../fixtures/ressources.js'
import {MemoryRouter} from 'react-router'
import getUrls from 'sesatheque-client/src/getUrls'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import window from '../setup'

Enzyme.configure({adapter: new Adapter()})

const domElement = document.getElementById('app')
const mountOptions = {
  attachTo: domElement
}

const getRoute = ({oid}) => `/ressource/decrire/${oid}`

const getStore = (ressource) => createStore(() => ({
  router: {
    location: {
      pathname: getRoute(ressource),
      search: '',
      hash: ''
    }
  },
  ressource
}))

describe('<Description />', () => {
  before(() => { global.window = window })
  after(() => { delete global.window })

  const getTestRenderer = (ressource) => {
    ressource._urls = getUrls(ressource)
    const store = getStore(ressource)
    const WrappedComponent = () => (
      <MemoryRouter>
        <Provider store={store}>
          <Description ressource={ressource} />
        </Provider>
      </MemoryRouter>
    )
    return mount(<WrappedComponent />, mountOptions)
  }

  const check = (ressource) => {
    const testComponent = getTestRenderer(ressource)

    const isAlias = !!ressource.aliasOf
    // Le titre
    const expectedTitre = ressource.titre + (isAlias ? ' (alias)' : '')
    expect(testComponent.find('h1').text()).to.equals(expectedTitre)

    // Le bloc de description doit contenir le bon nb de div
    const bloc = testComponent.find('.grid-5.has-gutter.clear-right')
    let expectedLength = 14 // la base pour tous
    if (isAlias) {
      expectedLength += 2
    } else {
      expectedLength += 12
      ;['_auteurs', '_contributeurs', '_relations', 'groupes'].forEach(key => {
        if (ressource[key] && ressource[key].length) expectedLength += ressource[key].length * 2
      })
    }
    expect(bloc.children()).to.have.length(expectedLength)
  }

  it('affiche les infos d’une ressource', () => {
    check(ressources[0])
  })
  it('affiche les infos d’un alias', () => {
    check(ressources[2])
  })
})
