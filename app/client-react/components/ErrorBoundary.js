import bugsnagReact from '@bugsnag/plugin-react'
import PropTypes from 'prop-types'
import React from 'react'
import getBugsnagClient from '../utils/getBugsnagClient'

let ErrorBoundary

const bugsnagClient = getBugsnagClient()

if (bugsnagClient) {
  // cf https://docs.bugsnag.com/platforms/javascript/react/
  bugsnagClient.use(bugsnagReact, React)
  ErrorBoundary = bugsnagClient.getPlugin('react')
} else {
  // Si la config bugsnag est absente, ErrorBoundary rend les enfants tel quel
  ErrorBoundary = ({children}) => ({...children})
}

ErrorBoundary.propTypes = {
  children: PropTypes.node
}

export default ErrorBoundary
