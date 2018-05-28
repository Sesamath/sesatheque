import React, {Fragment} from 'react'
import {Field} from 'redux-form'

const CheckboxGroup = ({name, title, values}) => (
  <div>
    <h3>{title}</h3>
    {values.map((value, index) => (
      <Fragment key={index.toString()}>
        <label htmlFor={`categories[${index}]`}>{value}</label>
        <div>
          <Field
            name={`categories[${index}]`}
            id={`categories[${index}]`}
            component="input"
            type="checkbox"
          />
        </div>
      </Fragment>
    ))}
  </div>
)

export default CheckboxGroup
