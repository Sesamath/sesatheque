import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const SelectField = ({
  label,
  values,
  disabled = false,
  optional = false
}) => (
  <label className="select">
    {label}
    <Field
      name="type"
      component="select"
      disabled={disabled}
    >
      {optional ? (
        <option>peu importe</option>
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
  label: PropTypes.string,
  values: PropTypes.object,
  disabled: PropTypes.bool,
  optional: PropTypes.bool
}

export default SelectField
