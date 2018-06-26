import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'

const normalize = (value, previousValue = null) => {
  if (value === '') {
    return null
  }

  const parsed = parseInt(value, 10)

  return Number.isNaN(parsed) ? previousValue : parsed
}

const IntegerField = ({
  name,
  ...otherProps
}) => (
  <Field
    name={name}
    normalize={normalize}
    component="input"
    type="number"
    {...otherProps}
  />
)

IntegerField.propTypes = {
  name: PropTypes.string
}

export default IntegerField
