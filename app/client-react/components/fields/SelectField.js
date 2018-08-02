import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import MultiSelectInput from './inputs/MultiSelectInput'
import addLabel from './hoc/addLabel'

const SelectField = ({
  disabled,
  label,
  multi,
  name,
  options,
  placeholder
}) => (
  <Field
    placeholder={placeholder || label}
    name={name}
    options={options}
    multi={multi}
    component={MultiSelectInput}
    disabled={disabled}
  />
)

SelectField.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string,
  multi: PropTypes.bool,
  name: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    // value peut être de n'importe quel type parmi string|boolean|number, si on passe autre chose
    // react-select (wrappé par MultiSelectInput) râlera
    label: PropTypes.string
  })),
  placeholder: PropTypes.string
}

export default addLabel(SelectField)
