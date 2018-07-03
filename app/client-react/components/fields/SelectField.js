import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'

const SelectField = ({
  children,
  name,
  label,
  values,
  disabled = false
}) => (
  <label className="select">
    {label}
    <Field
      name={name}
      component="select"
      disabled={disabled}
    >
      {children}
      {Object.keys(values).map(key => (
        <option key={key} value={key}>
          {values[key]}
        </option>
      ))}
    </Field>
  </label>
)

SelectField.propTypes = {
  children: PropTypes.node,
  name: PropTypes.string,
  label: PropTypes.string,
  values: PropTypes.object,
  disabled: PropTypes.bool
}

export default SelectField
