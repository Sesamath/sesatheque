import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import SelectInput from './inputs/SelectInput'
import addLabel from './hoc/addLabel'

const getPlaceholder = (label) => {
  if (typeof label === 'string') return label
  return null
}

const SelectField = ({
  label,
  placeholder,
  ...otherProps
}) => (
  <Field
    placeholder={placeholder || getPlaceholder(label)}
    component={SelectInput}
    {...otherProps}
  />
)

SelectField.propTypes = {
  label: PropTypes.node,
  placeholder: PropTypes.string
}

export default addLabel(SelectField, false)
