import bugsnagJs from '@bugsnag/js'
import bugsnagReact from '@bugsnag/plugin-react'
import PropTypes from 'prop-types'
import React from 'react'
import config from '../../server/config'

const {application, bugsnag} = config

let ErrorBoundary

if (bugsnag && bugsnag.apiKey) {
  const {
    apiKey,
    appVersion
  } = bugsnag

  const bugsnagClient = bugsnagJs({
    // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#apikey
    apiKey,
    // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#appversion
    appVersion,
    // https://docs.bugsnag.com/platforms/browsers/js/configuration-options/#releasestage
    releaseStage: application.staging
  })

  ErrorBoundary = bugsnagClient.use(bugsnagReact(React))
} else {
  // Si la config bugsnag est absente, on rend les enfants:
  ErrorBoundary = ({children}) => ({...children})
}

ErrorBoundary.propTypes = {
  children: PropTypes.node
}

export default ErrorBoundary
