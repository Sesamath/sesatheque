import React, {Component, Fragment} from 'react'
import {autocomplete, search} from 'sesatheque-client/src/client'
import {debounce} from 'lodash'
import {addSesatheques} from 'sesatheque-client/src/sesatheques'
import config from '../../server/config'
import {listes} from '../../server/ressource/config'
import {Async as Select} from 'react-select'
import {ResourceList} from './ResourceList'
import 'react-select/dist/react-select.css'

const optionToText = (label, value) => {
  return listes[label] ? listes[label][value] : value
}

const debouncedGET = debounce((input, callback) => {
  autocomplete(config.baseId, input, (error, filters) => {
    if (error) return console.error(error)

    const options = []
    for (const filter in filters) {
      for (const value in filters[filter]) {
        options.push({
          value: {filter, value: filters[filter][value]},
          label: filter
        })
      }
    }

    return callback(null, { options })
  })
}, 500)

const getOptions = (input, callback) => {
  if (!input) return callback(null, ({ options: [] }))
  debouncedGET(input, callback)
}

class AutocompleteForm extends Component {
  constructor (props) {
    super(props)
    addSesatheques(config.sesatheques)

    this.state = {
      resources: [],
      selection: []
    }
  }

  searchResources () {
    const queryFilters = {}
    this.state.selection.forEach(element => {
      if (queryFilters[element.label] === undefined) queryFilters[element.label] = []
      queryFilters[element.label].push(element.value.value)
    })

    search(config.baseId, queryFilters, (error, resources) => {
      if (error) return console.error(error)
      this.setState({resources})
    })
  }

  optionRenderer (option) {
    return `${optionToText(option.label, option.value.value)} (${option.label})`
  }

  valueRenderer (option) {
    return `${option.label} : ${optionToText(option.label, option.value.value)}`
  }

  render () {
    return (
      <Fragment>
        <div className="grid-5">
          <Select
            className="col-4"
            value={this.state.selection}
            clearable={false}
            closeOnSelect={false}
            filterOption={() => (true)}
            removeSelected={false}
            onChange={selection => this.setState({selection})}
            optionRenderer={this.optionRenderer}
            valueRenderer={this.valueRenderer}
            placeholder="Votre recherche"
            noResultsText="Aucun résultat trouvé"
            loadingPlaceholder="Recherche en cours"
            loadOptions={getOptions}
            multi={true}
          />
          <button
            className="btn"
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
