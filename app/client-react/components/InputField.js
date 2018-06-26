import React, {Fragment} from 'react'
import Classification from './Classification'
import {Field} from 'redux-form'

const InputField = ({label, name, disabled}) => (
  <Fragment>
    <label>
      {label}
      <Field
        name={name}
        component="input"
        type="text"
        props={{ disabled: disabled !== undefined }}
        />
    </label>
  </Fragment>
)

export default InputField
