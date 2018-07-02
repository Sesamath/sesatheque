import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const SelectField = ({
  children,
  name,
  label,
  values,
  disabled = false,
  optional = false
}) => (
  <label className="select">
    {label}
    <Field
      name={name}
      component="select"
      disabled={disabled}
    >
      {children}
      {optional ? (
        <option value="">peu importe</option>
      ) : null}
      {Object.keys(values).map(key => (
        <Fragment key={key.toString()}>
          <option value={key}>{values[key]}</option>
        </Fragment>
      ))}
    </Field>
  </label>
)

SelectField.propTypes = {
  children: PropTypes.node,
  name: PropTypes.string,
  label: PropTypes.string,
  values: PropTypes.object,
  disabled: PropTypes.bool,
  optional: PropTypes.bool
}

export default SelectField
