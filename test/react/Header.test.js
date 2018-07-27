import React from 'react'
import TestRenderer from 'react-test-renderer'
import {application} from '../../_private/test'
import {expect} from 'chai'
import {Header} from '../../app/client-react/components/Header'
import utilisateurs from '../fixtures/utilisateurs.js'
import {MemoryRouter} from 'react-router'

const props = {
  personne: utilisateurs[0],
  loginLinks: [{href: application.baseUrl}],
  logoutUrl: application.baseUrl,
  sso: {
    links: [
      {
        href: application.baseUrl + 'profile',
        icon: 'user-secret',
        value: 'Informations personnelles'
      },
      {
        href: application.baseUrl + 'accueil',
        icon: 'home',
        value: ' Mon espace Sésamath'
      }
    ],
    name: 'Sésamath'
  }
}

describe('<Header />', () => {
  const wrappedComponent = (connected) => {
    let headerProps = {...props}
    if (!connected) headerProps.personne = null
    return <MemoryRouter><Header {...headerProps} /></MemoryRouter>
  }

  it('renders connected links', () => {
    const component = TestRenderer.create(wrappedComponent(true))
    expect(component.root.findByType('nav').children).to.have.length(5)
  })

  it('renders disconnected links', () => {
    const component = TestRenderer.create(wrappedComponent(false))
    expect(component.root.findByType('nav').children).to.have.length(2)
  })
})
