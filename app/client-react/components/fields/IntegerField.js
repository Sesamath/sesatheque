import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import Input from './inputs/Input'
import addLabel from './hoc/addLabel'

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
    component={Input}
    type="number"
    {...otherProps}
  />
)

IntegerField.propTypes = {
  name: PropTypes.string
}

export default addLabel(IntegerField)
