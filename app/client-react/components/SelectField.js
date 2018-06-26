import React, {Fragment} from 'react'
import Classification from './Classification'
import {Field} from 'redux-form'

const SelectField = ({label, values, disabled}) => (
  <Fragment>
    <label className="select">
      {label}
      <Field name="type" component="select" props={{ disabled }}>
        {Object.keys(values).map(key => (
          <Fragment key={key.toString()}>
            <option value={key}>{values[key]}</option>
          </Fragment>
        ))}
      </Field>
    </label>
  </Fragment>
)

export default SelectField
