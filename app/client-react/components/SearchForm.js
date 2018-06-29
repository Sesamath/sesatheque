import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {reduxForm} from 'redux-form'
import {listes, labels} from '../../server/ressource/config'
import {POST} from '../utils/httpMethods'
import Classification from './Classification'
import {
  InputField,
  ResourceTypesField,
  SelectField,
  SwitchField
} from './fields'
import ResourceList from './ResourceList'

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

    POST(`/api/liste/prof`, {body: {
      format: 'full',
      filters
    }})
      .then((resourceList) => this.setState({resourceList: Object.values(resourceList.liste)}))
      .catch(() => this.setState({resourceList: []}))
  }

  render () {
    return (
      <Fragment>
        <h1>Recherche de ressources</h1>
        <form onSubmit={this.props.handleSubmit(this.search.bind(this))}>
          <fieldset>
            <div className="grid-5">
              <InputField
                className="col-3"
                label={labels.titre}
                info="(Vous pouvez utiliser le symbole % comme caractère joker)"
                name="titre" />
              <ResourceTypesField
                label={labels.type}
                optional />
              <SwitchField
                className="center"
                checked
                label={labels.publie}
                name="publie" />

              <InputField
                label={labels.oid}
                name="oid" />
              <InputField
                label={labels.origine}
                name="origine" />
              <InputField
                label={labels.idOrigine}
                name="idOrigine" />
              <SelectField
                label={labels.langue}
                values={listes.langue}
                name="langue"
                optional />
              <SelectField
                label={labels.restriction}
                values={listes.restriction}
                name="restriction" />
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

SearchForm.propTypes = {
  handleSubmit: PropTypes.func
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
