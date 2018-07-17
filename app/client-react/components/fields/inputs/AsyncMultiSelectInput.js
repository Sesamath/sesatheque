import PropTypes from 'prop-types'
import React from 'react'
import {Async as Select} from 'react-select'
import showInvalidField from '../hoc/showInvalidField'

import 'react-select/dist/react-select.css'

const AsyncMultiSelectInput = ({
  input: {name, onFocus, onBlur, onChange, value},
  meta: {error, warning, touched},
  placeholder,
  options,
  disabled,
  loadOptions,
  multi
}) => (
  <Select
    clearable={false}
    value={value}
    name={name}
    onFocus={onFocus}
    closeOnSelect={false}
    onChange={(selection) => {
      onChange(selection)
    }}
    onBlur={() => onBlur(value)}
    placeholder={placeholder}
    options={options}
    disabled={disabled}
    noResultsText="Aucun résultat trouvé"
    multi={multi}
    loadOptions={loadOptions}
    loadingPlaceholder="Recherche en cours"
  />
)

AsyncMultiSelectInput.propTypes = {
  multi: PropTypes.bool,
  loadOptions: PropTypes.func,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.node,
    label: PropTypes.string
  })),
  disabled: PropTypes.bool,
  input: PropTypes.shape({}),
  meta: PropTypes.shape({})
}

export default showInvalidField(AsyncMultiSelectInput)
