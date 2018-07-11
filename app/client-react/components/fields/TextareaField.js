import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import addLabel from './hoc/addLabel'

const TextareaField = ({name, label, ...otherProps}) => (
  <Field
    name={name}
    component="textarea"
    placeholder={label}
    {...otherProps}
  />
)

TextareaField.propTypes = {
  otherProps: PropTypes.object,
  name: PropTypes.string,
  label: PropTypes.string
}

export default addLabel(TextareaField)
