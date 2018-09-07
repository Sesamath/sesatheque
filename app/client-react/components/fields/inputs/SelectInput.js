import PropTypes from 'prop-types'
import React from 'react'
import Select, {Async as AsyncSelect} from 'react-select'
import showInvalidField from '../hoc/showInvalidField'

const getValue = (value, options, isMulti) => {
  const find = (val) => options.find(({value: itemValue}) => val === itemValue)
  if (isMulti) {
    return value.map(find)
  }

  return find(value)
}

const SelectInput = ({
  input: {name, onFocus, onBlur, onChange, value},
  meta: {error, warning, touched},
  placeholder,
  options,
  isDisabled,
  isMulti = false,
  isClearable,
  loadOptions,
  components
}) => {
  const isAsync = !!loadOptions
  const SelectComponent = isAsync ? AsyncSelect : Select

  return (
    <SelectComponent
      classNamePrefix="react-select"
      components={components}
      isClearable={typeof isClearable === 'boolean' ? isClearable : isMulti}
      value={isAsync ? value : getValue(value, options, isMulti)}
      name={name}
      onFocus={onFocus}
      onBlur={() => onBlur()}
      closeMenuOnSelect={!isMulti}
      onChange={(selection, {action, removedValue}) => {
        if (['pop-value', 'remove-value'].includes(action) && removedValue.isUndeletable) {
          return
        }

        if (isAsync) {
          return onChange(selection)
        }

        if (isMulti) {
          return onChange(selection.map(option => option.value))
        }

        return onChange(selection.value)
      }}
      placeholder={placeholder}
      removeSelected
      options={options}
      isDisabled={isDisabled}
      loadOptions={loadOptions}
      noOptionsMessage={() => 'Aucun résultat trouvé'}
      loadingMessage={() => 'Recherche en cours'}
      isMulti={isMulti}
      isSearchable={isAsync}
    />
  )
}

SelectInput.propTypes = {
  isMulti: PropTypes.bool,
  isClearable: PropTypes.bool,
  isDisabled: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    // value peut être de n'importe quel type parmi string|boolean|number, si on passe autre chose react-select râlera
    label: PropTypes.string
  })),
  input: PropTypes.shape({}),
  meta: PropTypes.shape({}),
  loadOptions: PropTypes.func,
  components: PropTypes.object
}

export default showInvalidField(SelectInput)
