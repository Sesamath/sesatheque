import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'

const InputField = ({className, info, label, name, disabled}) => (
  <label className={className}>
    {label} {info && (<i>{info}</i>)}
    <Field
      name={name}
      component="input"
      type="text"
      disabled={disabled}
    />
  </label>
)

InputField.propTypes = {
  className: PropTypes.string,
  info: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool
}

export default InputField
