import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const InputField = ({label, name, disabled}) => (
  <Fragment>
    <label>
      {label}
      <Field
        name={name}
        component="input"
        type="text"
        props={{ disabled: Boolean(disabled) }}
        />
    </label>
  </Fragment>
)

InputField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool
}

export default InputField
