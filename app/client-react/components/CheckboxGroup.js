import {identity} from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import SingleCheckboxForGroups from './SingleCheckboxForGroups'

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
          <SingleCheckboxForGroups
            value={value}
            inputValue={inputValue}
            onChange={onChange}
            parseValue={parseValue}
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
