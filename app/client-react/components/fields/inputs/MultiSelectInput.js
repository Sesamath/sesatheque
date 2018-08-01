import PropTypes from 'prop-types'
import React from 'react'
import Select from 'react-select'
import showInvalidField from '../hoc/showInvalidField'

const getValue = (value, options, isMulti) => {
  const find = (val) => options.find(({value: itemValue}) => val === itemValue)
  if (isMulti) {
    return value.map(find)
  }

  return find(value)
}

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
    value={getValue(value, options, multi)}
    name={name}
    onFocus={onFocus}
    closeMenuOnSelect={!multi}
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
    isMulti={multi}
  />
)

MultiSelectInput.propTypes = {
  multi: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    // value peut être de n'importe quel type parmi string|boolean|number, si on passe autre chose react-select râlera
    label: PropTypes.string
  })),
  disabled: PropTypes.bool,
  input: PropTypes.shape({}),
  meta: PropTypes.shape({})
}

export default showInvalidField(MultiSelectInput)
