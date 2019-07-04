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

const customStyles = {
  control: (styles) => ({
    ...styles,
    backgroundColor: '#f8f9fb',
    borderRadius: '3px',
    border: '1px solid #eaeaec',
    padding: '2px',
    fontWeight: 'normal'
  }),
  multiValue: (styles) => ({
    ...styles,
    backgroundColor: 'rgba(0, 126, 255, 0.08)',
    borderRadius: '2px',
    border: '1px solid #c2e0ff'
  }),
  multiValueLabel: (styles) => ({
    ...styles,
    color: '#007eff'
  })
}

const SelectInput = ({
  input: {name, onFocus, onBlur, onChange, value},
  /* meta: {error, warning, touched}, */
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
      styles={customStyles}
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
  // lui vient de redux-form qui garanti tout ça, mais faut lister ce qu'on utilise
  input: PropTypes.shape({
    name: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    value: PropTypes.string
  }),
  loadOptions: PropTypes.func,
  components: PropTypes.object
}

export default showInvalidField(SelectInput)
