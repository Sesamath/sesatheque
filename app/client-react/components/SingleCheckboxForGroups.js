import {identity} from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'

const SingleCheckboxForGroups = ({
  value,
  inputValue,
  onChange,
  parseValue = identity
}) => (
  <input
    value={value}
    checked={inputValue.includes(parseValue(value))}
    type="checkbox"
    onChange={({
      target: {
        checked,
        value: targetValue
      }
    }) => {
      const parsedValue = parseValue(targetValue)
      onChange(checked
        ? [...inputValue, parsedValue]
        : inputValue.filter(item => item !== parsedValue)
      )
    }}
  />
)

SingleCheckboxForGroups.propTypes = {
  value: PropTypes.node,
  inputValue: PropTypes.arrayOf(PropTypes.node),
  onChange: PropTypes.func,
  parseValue: PropTypes.func
}

export default SingleCheckboxForGroups
