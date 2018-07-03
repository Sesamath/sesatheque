import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {reduxForm} from 'redux-form'
import {listes, labels} from '../../server/ressource/config'
import Classification from './Classification'
import {
  InputField,
  ResourceTypesField,
  SelectField,
  SwitchField
} from './fields'
import history from '../history'
import queryString from 'query-string'

class SearchForm extends Component {
  componentDidMount () {
    const fields = queryString.parse(history.location.search)
    Object.keys(fields).map(key => {
      this.props.change(key, fields[key])
    })
  }

  updateQueryParams (query) {
    history.push({
      pathname: '/ressources',
      search: queryString.stringify(query)
    })
  }

  render () {
    return (
      <Fragment>
        <h1>Recherche de ressources</h1>
        <form onSubmit={this.props.handleSubmit(this.updateQueryParams.bind(this))}>
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
              <InputField
                label={labels.auteurs}
                name="auteurs" />
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
      </Fragment>
    )
  }
}

SearchForm.propTypes = {
  handleSubmit: PropTypes.func,
  change: PropTypes.func
}

export default reduxForm({
  form: 'searchForm',
  initialValues: {
    categories: [],
    niveaux: [],
    typePedagogiques: [],
    typeDocumentaires: [],
    langue: 'fra',
    publie: true
  }
})(SearchForm)
