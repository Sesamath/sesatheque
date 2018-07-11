import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import addLabel from './hoc/addLabel'

const TextareaField = ({name, ...otherProps}) => (
  <Field
    name={name}
    component="textarea"
    {...otherProps}
  />
)

TextareaField.propTypes = {
  otherProps: PropTypes.object,
  name: PropTypes.string
}

export default addLabel(TextareaField)
