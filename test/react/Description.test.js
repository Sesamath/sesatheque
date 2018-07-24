import React from 'react'
import {Provider} from 'react-redux'
import TestRenderer from 'react-test-renderer'
import {expect} from 'chai'
import {Description} from '../../app/client-react/components/Description'
import {createStore} from 'redux'
import ressources from '../fixtures/ressources.js'
import {MemoryRouter} from 'react-router'
import getUrls from 'sesatheque-client/src/getUrls'

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

const getTestRenderer = (ressource) => {
  ressource._urls = getUrls(ressource)
  const store = getStore(ressource)
  const wrappedComponent = (
    <MemoryRouter>
      <Provider store={store}>
        <Description ressource={ressource} />
      </Provider>
    </MemoryRouter>
  )
  return TestRenderer.create(wrappedComponent)
}

describe('<Description />', () => {
  const check = (ressource) => {
    const testComponent = getTestRenderer(ressource)

    const isAlias = !!ressource.aliasOf
    // Le titre
    const h1 = testComponent.root.findByType('h1')
    expect(h1.children).to.have.length(1)
    const expectedTitre = ressource.titre + (isAlias ? ' (alias)' : '')
    expect(h1.children[0]).to.equals(expectedTitre)

    // Le bloc de description doit contenir le bon nb de div
    const bloc = testComponent.root.findByProps({className: 'grid-5 has-gutter'})
    let expectedLength = 14 // la base pour tous
    if (isAlias) {
      expectedLength += 2
    } else {
      expectedLength += 12
      ;['_auteurs', '_contributeurs', '_relations', 'groupes'].forEach(key => {
        if (ressource[key] && ressource[key].length) expectedLength += ressource[key].length * 2
      })
    }
    expect(bloc.children).to.have.length(expectedLength)
    // console.log(firstResource)
  }

  it('affiche les infos d’une ressource', () => {
    check(ressources[0])
  })
  it('affiche les infos d’un alias', () => {
    check(ressources[2])
  })
})
