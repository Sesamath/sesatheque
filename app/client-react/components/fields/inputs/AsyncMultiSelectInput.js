import PropTypes from 'prop-types'
import React from 'react'
import {Async as Select} from 'react-select'
import showInvalidField from '../hoc/showInvalidField'

/**
 * Redux-form react-select input with async loaded options
 * @todo factor with MultiSelectInput
 *
 */
const AsyncMultiSelectInput = ({
  input: {name, onFocus, onBlur, onChange, value},
  meta: {error, warning, touched},
  placeholder,
  options,
  disabled,
  loadOptions,
  isMulti,
  components
}) => (
  <Select
    components={components}
    isClearable={false}
    value={value}
    name={name}
    onFocus={onFocus}
    closeOnSelect={false}
    onChange={(selection) => {
      console.log(selection)
      onChange(selection)
    }}
    onBlur={() => onBlur(value)}
    placeholder={placeholder}
    options={options}
    disabled={disabled}
    noOptionsMessage={() => 'Aucun résultat trouvé'}
    loadingMessage={() => 'Recherche en cours'}
    isMulti={isMulti}
    loadOptions={loadOptions}
  />
)

AsyncMultiSelectInput.propTypes = {
  isMulti: PropTypes.bool,
  loadOptions: PropTypes.func,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    // value peut être de n'importe quel type parmi string|boolean|number, si on passe autre chose react-select râlera
    label: PropTypes.string
  })),
  disabled: PropTypes.bool,
  input: PropTypes.shape({}),
  meta: PropTypes.shape({})
}

export default showInvalidField(AsyncMultiSelectInput)
