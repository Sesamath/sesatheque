import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import SelectInput from './inputs/SelectInput'
import addLabel from './hoc/addLabel'

const SelectField = ({
  label,
  placeholder,
  ...otherProps
}) => (
  <Field
    placeholder={placeholder || label}
    component={SelectInput}
    {...otherProps}
  />
)

SelectField.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string
}

export default addLabel(SelectField)
