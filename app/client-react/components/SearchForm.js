import {listes, labels} from '../../server/ressource/config'
import {reduxForm} from 'redux-form'
import {POST} from '../utils/httpMethods'
import Classification from './Classification'
import {
  InputField,
  ResourceTypesField,
  SelectField
} from './fields'
import MetaForm from './MetaForm'
import React, {Component, Fragment} from 'react'
import {connect} from 'react-redux'
import ResourceList from './ResourceList'

const publieValues = {
  'true': 'Oui',
  'false': 'Non'
}

class SearchForm extends Component {
  constructor (props) {
    super(props)

    this.state = {
      resourceList: []
    }
  }

  search (query) {
    const filters = []
    Object.keys(query).map((key, index) => {
      if (!query[key] || query[key] === 'peu importe') return
      const values = Array.isArray(query[key]) ? query[key] : [query[key]]
      filters.push({index: key, values})
    })

    POST(`/api/liste/prof`, { body : {
        format: 'full',
        filters
      }
    })
      .then((resourceList) => this.setState({resourceList: Object.values(resourceList.liste)}))
      .catch(()=> this.setState({resourceList: []}))
  }

  render () {
    return (
      <Fragment>
        <h1>Recherche de ressources</h1>
        <form onSubmit={this.props.handleSubmit(this.search.bind(this))}>
          <fieldset>
            <div className="grid-3">
              <InputField
                label={labels.titre}
                name="titre" />
            </div>
            <div className="grid-3">
              <InputField
                label={labels.oid}
                name="oid" />
              <InputField
                label={labels.origine}
                name="origine" />
              <InputField
                label={labels.idOrigine}
                name="idOrigine" />
              <ResourceTypesField
                label={labels.type}
                optional />
              <SelectField
                label={labels.langue}
                values={listes.langue}
                name="langue"
                optional />
              <SelectField
                label={labels.publie}
                values={publieValues}
                name="publie"
                optional />
            </div>
          </fieldset>
          <hr />
          <Classification detailled />
          <div className="buttons-area">
            <button
            type="submit"
            className="btn--primary"
            >
            Rechercher
            </button>
          </div>
        </form>
        <ResourceList resources={this.state.resourceList} />
      </Fragment>
    )
  }
}

export default reduxForm({
  form: 'searchForm',
  initialValues: {
    categories: [],
    niveaux: [],
    typePedagogiques: [],
    typeDocumentaires: [],
    langue: 'fra'
  }
})(SearchForm)
