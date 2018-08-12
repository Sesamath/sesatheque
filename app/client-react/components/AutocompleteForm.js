import React, {Component, Fragment} from 'react'
import {autocomplete, search} from 'sesatheque-client/src/client'
import {debounce} from 'lodash'
import config from '../../server/config'
import {labels, listes} from '../../server/ressource/config'
import {Async as Select} from 'react-select'
import {ResourceList} from './ResourceList'

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
    const options = []
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
    const queryFilters = {}
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
          <Select
            classNamePrefix="react-select"
            className="col-4"
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
            isMulti
          />
          <button
            className="btn btn--rounded"
            onClick={this.searchResources.bind(this)}>Rechercher</button>
        </div>
        <ResourceList
          handlePageClick={() => {}}
          queryOptions={{skip: 0, limit: 100}}
          resources={this.state.resources}
          total={this.state.resources.length} />
      </Fragment>
    )
  }
}

export default AutocompleteForm
