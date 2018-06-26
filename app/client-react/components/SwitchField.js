import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const SwitchField = ({label, name}) => (
  <Fragment>
    <label>
      {label}
      <Field
        name={name}
        component="input"
        type="checkbox"
        className="switch" />
    </label>
  </Fragment>
)

export default SwitchField
