import React from 'react'
import PropTypes from 'prop-types'
import {application} from '../../../_private/test'
import {expect} from 'chai'
import {Header} from '../../../app/client-react/components/Header'
import utilisateurs from '../../fixtures/utilisateurs.js'
import {MemoryRouter} from 'react-router'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import window from '../setup'

Enzyme.configure({adapter: new Adapter()})

const domElement = document.getElementById('app')
const mountOptions = {
  attachTo: domElement
}

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
  before(() => { global.window = window })
  after(() => { delete global.window })

  const WrappedComponent = ({connected}) => {
    const headerProps = {...props}
    if (!connected) headerProps.personne = null
    return <MemoryRouter><Header {...headerProps} /></MemoryRouter>
  }
  WrappedComponent.propTypes = {
    connected: PropTypes.bool
  }

  it('renders connected links', () => {
    const wrapper = mount(<WrappedComponent connected />, mountOptions)
    expect(wrapper.find('nav').children()).to.have.length(5)
  })

  it('renders disconnected links', () => {
    const wrapper = mount(<WrappedComponent />, mountOptions)
    expect(wrapper.find('nav').children()).to.have.length(2)
  })
})
