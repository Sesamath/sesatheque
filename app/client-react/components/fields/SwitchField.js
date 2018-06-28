import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'

const SwitchField = ({label, name}) => (
  <label>
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
  label: PropTypes.string,
  name: PropTypes.string
}

export default SwitchField
