import PropTypes from 'prop-types'
import React from 'react'
import {Field} from 'redux-form'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

const MultiSelectField = ({
  name,
  label,
  placeholder,
  options,
  disabled = false
}) => (
  <label className="select">
    {label}
    <Field
      name={name}
      component={({input}) =>
        <Select
          {...input}
          closeOnSelect={false}
          onChange={(selectedOption) => input.onChange(selectedOption.map(option => option.value))}
          onBlur={() => input.onBlur(input.value)}
          placeholder={placeholder}
          removeSelected={true}
          options={options}
          disabled={disabled}
          multi />
      } />
  </label>
)

MultiSelectField.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  disabled: PropTypes.bool
}

export default MultiSelectField
