import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'

const TextareaField = ({label, name}) => (
  <label>
    {label}
    <Field
      name={name}
      component="textarea" />
  </label>
)

TextareaField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string
}

export default TextareaField
