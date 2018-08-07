import bugsnag from 'bugsnag-js'
import React from 'react'
import createPlugin from 'bugsnag-react'

const bugsnagClient = bugsnag('API_KEY')

const ErrorBoundary = bugsnagClient.use(createPlugin(React))

export default ErrorBoundary
