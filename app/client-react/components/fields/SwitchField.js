import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'

const SwitchField = ({className, label, name}) => (
  <label className={className}>
    {label}
    <Field
      name={name}
      component="input"
      type="checkbox"
      className="switch"
    />
  </label>
)

SwitchField.propTypes = {
  checked: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string
}

export default SwitchField
