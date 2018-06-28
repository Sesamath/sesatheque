import {listes, labels} from '../../server/ressource/config'
import {reduxForm, formValueSelector} from 'redux-form'
import {POST} from '../utils/httpMethods'
import Classification from './Classification'
import InputField from './fields/InputField'
import MetaForm from './MetaForm'
import NavMenu from './NavMenu'
import React, {Component, Fragment} from 'react'
import {connect} from 'react-redux'
import ResourceTypesField from './fields/ResourceTypesField'
import ResourceList from './ResourceList'
import SelectField from './fields/SelectField'
import {searchRessources} from '../actions/ressource'

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

  search () {
    let filters = []
    Object.keys(this.props.query).map((key, index) => {
      if (!this.props.query[key] || this.props.query[key] === 'peu importe') return
      const values = Array.isArray(this.props.query[key]) ? this.props.query[key] : [this.props.query[key]]
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
        <NavMenu history={this.props.history} />
        <form>
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
            type="button"
            className="btn--primary"
            onClick={this.search.bind(this)}
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

SearchForm = reduxForm({
  form: 'searchForm',
  initialValues: {
    categories: [],
    niveaux: [],
    typePedagogiques: [],
    typeDocumentaires: [],
    langue: 'fra'
  }
})(SearchForm)

const selector = formValueSelector('searchForm')
SearchForm = connect(
  state => {
    return {
      query: selector(state, 'oid', 'titre', 'origine', 'idOrigine', 'type', 'publie',
                      'langue', 'categories', 'niveaux', 'typePedagogiques', 'typeDocumentaires')
    }
  }
)(SearchForm)

export default SearchForm
