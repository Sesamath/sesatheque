import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import Input from './inputs/Input'
import addLabel from './hoc/addLabel'

const InputField = ({
  className,
  label,
  name,
  placeholder,
  disabled,
  type = 'text'
}) => (
  <Field
    className={className}
    placeholder={placeholder || label}
    name={name}
    component={Input}
    type={type}
    disabled={disabled}
  />
)

InputField.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool,
  type: PropTypes.string
}

/**
 * Composant d'input avec les props classiques
 * - [className] une ou des classes css
 * - [label] un label qui sera affiché dans un <label> lié au field
 * - [info] un éventuel complément de label (affiché dans un <i>)
 * - name le nom de l'input (variable du form)
 * mais aussi
 * - [type=text]
 * - [disabled=false]
 * - [placeholder=${label}]
 */
export default addLabel(InputField)
