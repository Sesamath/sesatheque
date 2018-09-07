import PropTypes from 'prop-types'
import React from 'react'
import showInvalidField from '../hoc/showInvalidField'

const Input = ({
  className,
  input,
  placeholder,
  type,
  disabled = false
}) => (
  <input
    id={`${input.name}-field`}
    {...input}
    placeholder={placeholder}
    type={type}
    className={className}
    disabled={disabled}
  />
)

Input.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  input: PropTypes.object,
  placeholder: PropTypes.string,
  type: PropTypes.string
}

export default showInvalidField(Input)
