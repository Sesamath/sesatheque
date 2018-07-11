import React from 'react'
import TestRenderer from 'react-test-renderer'
import {expect} from 'chai'
import {Footer} from '../../app/client-react/components/Footer'
import {MemoryRouter} from 'react-router'

describe('<Footer />', () => {
  const wrappedComponent = <MemoryRouter><Footer /></MemoryRouter>

  it('renders without crashing', () => {
    TestRenderer.create(wrappedComponent)
  })

  it('renders links', () => {
    const component = TestRenderer.create(wrappedComponent)
    expect(component.root.findAllByType('li')).to.have.length(3)
  })
})
