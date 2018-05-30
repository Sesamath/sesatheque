import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const CheckboxGroup = ({name, title, values}) => (
  <div className="checkbox-group">
    <h3>{title}</h3>
    {values.map((value, index) => (
      <Fragment key={index.toString()}>
        <label>
          <Field
            name={`${name}[${index}]`}
            component="input"
            type="checkbox"
            className="checkbox"
          />
          {value}
        </label>
      </Fragment>
    ))}
  </div>
)

export default CheckboxGroup
