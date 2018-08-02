import React, {Component, Fragment} from 'react'
import {autocomplete, search} from 'sesatheque-client/src/client'
import {debounce} from 'lodash'
import config from '../../server/config'
import {labels, listes} from '../../server/ressource/config'
import {Async as Select} from 'react-select'
import {ResourceList} from './ResourceList'

const optionValueToText = (label, value) => listes[label] ? listes[label][value] : value
const optionLabelToText = label => labels[label]

const debouncedGET = debounce((input, callback) => {
  autocomplete(config.baseId, input, (error, filters) => {
    if (error) return console.error(error)

    const options = []
    for (const filter in filters) {
      for (const value in filters[filter]) {
        // Note : l'attribut "value" possède l'ensemble d'une option pour éviter
        // un bug lié à l'unicité d'une clé qui provoque des comportements étranges avec react-select
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
  if (!input || input.length <= 2) return callback(null, ({ options: [] }))
  debouncedGET(input, callback)
}

class AutocompleteForm extends Component {
  constructor (props) {
    super(props)

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
    return `${optionValueToText(option.label, option.value.value)} (${optionLabelToText(option.label)})`
  }

  valueRenderer (option) {
    return `${optionLabelToText(option.label)} : ${optionValueToText(option.label, option.value.value)}`
  }

  render () {
    return (
      <Fragment>
        <h1>Recherche assistée (beta)</h1>
        <div className="grid-5">
          <Select
            className="col-4"
            value={this.state.selection}
            clearable={true}
            closeOnSelect={false}
            onBlurResetsInput={false}
            onCloseResetsInput={false}
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
