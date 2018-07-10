import PropTypes from 'prop-types'
import React from 'react'
import showInvalidField from '../hoc/showInvalidField'

const Input = ({
  className,
  input,
  placeholder,
  name,
  type,
  disabled = false
}) => (
  <input
    {...input}
    placeholder={placeholder}
    type={type}
    name={name}
    className={className}
    disabled={disabled}
  />
)

Input.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  input: PropTypes.object,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string
}

export default showInvalidField(Input)
