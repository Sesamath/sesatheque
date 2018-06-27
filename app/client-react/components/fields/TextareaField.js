import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const TextareaField = ({label, name}) => (
  <Fragment>
    <label>
      {label}
      <Field
        name={name}
        component="textarea" />
    </label>
  </Fragment>
)

TextareaField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string
}

export default TextareaField
