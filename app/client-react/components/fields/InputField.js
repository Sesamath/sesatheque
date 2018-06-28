import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'

const InputField = ({label, name, disabled}) => (
  <label>
    {label}
    <Field
      name={name}
      component="input"
      type="text"
      disabled={disabled}
    />
  </label>
)

InputField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool
}

export default InputField
