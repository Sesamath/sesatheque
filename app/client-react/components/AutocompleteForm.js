import React, {Component, Fragment} from 'react'
import {autocomplete, search} from 'sesatheque-client/src/client'
import {debounce} from 'lodash'
import config from '../../server/config'
import {labels, listes} from '../../server/ressource/config'
import {Async as Select} from 'react-select'
import ResourceList from './ResourceList'

const defaultQuery = {
  skip: 0,
  limit: 100
}

class OptionValue {
  constructor (filter, filterValue) {
    this.filter = filter
    this.filterValue = filterValue
  }

  toString () {
    return `${this.filter}-${this.filterValue}`
  }
}

const optionValueToText = (label, value) => listes[label] ? listes[label][value] : value
const optionLabelToText = label => labels[label]

const debouncedGET = debounce((input, callback) => {
  autocomplete(config.baseId, input, (error, filters) => {
    if (error) return console.error(error)
    const options = [{
      value: new OptionValue('fulltext', input),
      label: `Texte libre : ${input}`
    }]

    for (const filter in filters) {
      filters[filter].forEach(filterValue => {
        options.push({
          value: new OptionValue(filter, filterValue),
          label: `${optionLabelToText(filter)}: ${optionValueToText(filter, filterValue)}`
        })
      })
    }
    return callback(options)
  })
}, 500)

const getOptions = (input, setOptions) => {
  if (!input || input.length <= 2) return setOptions([])
  debouncedGET(input, setOptions)
}

const customStyles = {
  multiValue: (styles, {data}) => {
    const overridedStyles = {
      ...styles,
      backgroundColor: 'rgba(0, 126, 255, 0.08)',
      borderRadius: '2px',
      border: '1px solid #c2e0ff',
      color: '#007eff'
    }

    if (data.value.filter === 'fulltext') {
      overridedStyles['backgroundColor'] = '#fcf8e3'
      overridedStyles['color'] = '#8a6d3b'
      overridedStyles['border'] = '1px solid #DFCFB3'
    }

    return overridedStyles
  }
}

class AutocompleteForm extends Component {
  constructor (props) {
    super(props)

    this.state = {
      resources: [],
      selection: []
    }
  }

  filterOption ({value}) {
    const key = value.toString()
    return this.state.selection.every(option => option.value.toString() !== key)
  }

  searchResources () {
    const queryFilters = {
      ...defaultQuery
    }
    this.state.selection.forEach(element => {
      if (queryFilters[element.value.filter] === undefined) queryFilters[element.value.filter] = []
      queryFilters[element.value.filter].push(element.value.filterValue)
    })

    search(config.baseId, queryFilters, (error, resources) => {
      if (error) return console.error(error)
      this.setState({resources})
    })
  }

  render () {
    return (
      <Fragment>
        <h1>Recherche assistée (beta)</h1>
        <div className="grid-5">
          <div className="col-4">
            <Select
              classNamePrefix="react-select"
              className="react-select"
              value={this.state.selection}
              clearable
              closeOnSelect={false}
              filterOption={this.filterOption.bind(this)}
              hideSelectedOptions
              onChange={selection => this.setState({selection})}
              placeholder="Votre recherche"
              noOptionsMessage={() => 'Aucun résultat trouvé'}
              loadingMessage={() => 'Recherche en cours'}
              loadOptions={getOptions}
              styles={customStyles}
              isMulti
            />
          </div>
          <button
            className="btn btn--rounded"
            onClick={this.searchResources.bind(this)}>Rechercher</button>
        </div>
        <ResourceList
          handlePageClick={() => {}}
          refreshList={this.searchResources.bind(this)}
          queryOptions={defaultQuery}
          resources={this.state.resources}
          total={this.state.resources.length} />
      </Fragment>
    )
  }
}

export default AutocompleteForm
