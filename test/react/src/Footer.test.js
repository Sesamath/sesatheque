import React from 'react'
import {expect} from 'chai'
import {Footer} from '../../../app/client-react/components/Footer'
import {MemoryRouter} from 'react-router'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import window from '../setup'

Enzyme.configure({adapter: new Adapter()})

const domElement = document.getElementById('app')
const mountOptions = {
  attachTo: domElement
}

describe('<Footer />', () => {
  before(() => { global.window = window })
  after(() => { delete global.window })

  const WrappedComponent = () => (<MemoryRouter><Footer /></MemoryRouter>)

  it('renders without crashing', () => {
    const wrapper = mount(<WrappedComponent />, mountOptions)
    expect(wrapper).to.exist
  })

  it('renders links', () => {
    const wrapper = mount(<WrappedComponent />, mountOptions)
    expect(wrapper.find('li')).to.have.length(3)
  })
})
