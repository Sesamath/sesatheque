import PropTypes from 'prop-types'
import React from 'react'
import Select from 'react-select'
import showInvalidField from '../hoc/showInvalidField'

import 'react-select/dist/react-select.css'

const MultiSelectInput = ({
  input: {name, onFocus, onBlur, onChange, value},
  meta: {error, warning, touched},
  placeholder,
  options,
  disabled,
  multi = false
}) => (
  <Select
    clearable={multi}
    value={value}
    name={name}
    onFocus={onFocus}
    closeOnSelect={!multi}
    onChange={(selection) => {
      if (multi) {
        return onChange(selection.map(option => option.value))
      }

      return onChange(selection.value)
    }}
    onBlur={() => onBlur(value)}
    placeholder={placeholder}
    removeSelected={true}
    options={options}
    disabled={disabled}
    noResultsText="Aucun résultat trouvé"
    multi={multi}
  />
)

MultiSelectInput.propTypes = {
  multi: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string
  })),
  disabled: PropTypes.bool,
  input: PropTypes.shape({}),
  meta: PropTypes.shape({})
}

export default showInvalidField(MultiSelectInput)
