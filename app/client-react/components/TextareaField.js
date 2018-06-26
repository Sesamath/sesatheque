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

export default TextareaField
