import {identity} from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'

const CheckboxGroup = ({
  parseValue = identity,
  title,
  values,
  input: {
    name,
    value: inputValue,
    onChange
  }
}) => (
  <div className="checkbox-group">
    <h3>{title}</h3>
    {
      values.map(([value, label]) => (
        <label key={value}>
          <input
            name={name}
            value={value}
            checked={inputValue.indexOf(parseValue(value)) > -1}
            type="checkbox"
            onChange={({
              target: {
                checked,
                value: targetValue
              }
            }) => {
              const parsedValue = parseValue(targetValue)
              const vals = [...inputValue]
              if (checked) {
                vals.push(parsedValue)
              } else {
                vals.splice(vals.indexOf(parsedValue), 1)
              }
              onChange(vals)
            }}
          />
          {label}
        </label>
      ))
    }
  </div>
)

CheckboxGroup.propTypes = {
  parseValue: PropTypes.func,
  title: PropTypes.string,
  values: PropTypes.array,
  input: PropTypes.shape({
    name: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func
  })
}

export default CheckboxGroup
