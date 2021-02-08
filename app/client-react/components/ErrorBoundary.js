import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import PropTypes from 'prop-types'
import React from 'react'
import getBugsnagClient from '../utils/getBugsnagClient'

let ErrorBoundary

// cf https://docs.bugsnag.com/platforms/javascript/react/
// App.js nous passe un onError

const bugsnagClient = getBugsnagClient({ plugins: [new BugsnagPluginReact(React)] })

if (bugsnagClient) {
  ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)
} else {
  // Si la config bugsnag est absente, ErrorBoundary rend les enfants tel quel
  ErrorBoundary = ({children}) => ({...children})
}

ErrorBoundary.propTypes = {
  children: PropTypes.node
}

export default ErrorBoundary
