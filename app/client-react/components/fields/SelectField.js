import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const SelectField = ({label, values, disabled = false}) => (
  <label className="select">
    {label}
    <Field name="type" component="select" props={{ disabled: Boolean(disabled) }}>
      {
        Object.keys(values).map(key => (
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
  disabled: PropTypes.bool
}

export default SelectField
