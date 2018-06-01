import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'

const CheckboxGroup = ({name, title, values}) => (
  <div className="checkbox-group">
    <h3>{title}</h3>
    {values.map((value, index) => (
      <label key={index.toString()}>
        <Field
          name={`${name}[${index}]`}
          component="input"
          type="checkbox"
          className="checkbox"
        />
        {value}
      </label>
    ))}
  </div>
)

CheckboxGroup.propTypes = {
  name: PropTypes.string,
  title: PropTypes.string,
  values: PropTypes.array
}

export default CheckboxGroup
