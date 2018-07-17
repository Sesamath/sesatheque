import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import AsyncMultiSelectInput from './inputs/AsyncMultiSelectInput'
import addLabel from './hoc/addLabel'

const AsyncSelectField = ({
  disabled,
  label,
  multi,
  name,
  options,
  placeholder,
  loadOptions
}) => (
  <Field
    placeholder={placeholder || label}
    name={name}
    options={options}
    multi={multi}
    component={AsyncMultiSelectInput}
    disabled={disabled}
    loadOptions={loadOptions}
  />
)

AsyncSelectField.propTypes = {
  loadOptions: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  multi: PropTypes.bool,
  name: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.node,
    label: PropTypes.string
  })),
  placeholder: PropTypes.string
}

export default addLabel(AsyncSelectField)
