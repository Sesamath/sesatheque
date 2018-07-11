import PropTypes from 'prop-types'
import React from 'react'

const Warning = ({message}) => (
  <div className="alert--danger"><i className="fa fa-exclamation-circle"></i>{message}</div>
)

Warning.propTypes = {
  message: PropTypes.string
}

export default Warning
