import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import {reduxForm} from 'redux-form'
import {listes, labels} from '../../server/ressource/config'
import Classification from './Classification'
import {
  InputField,
  ResourceTypesField,
  SelectField,
  SwitchField
} from './fields'
import queryString from 'query-string'

const SearchForm = ({handleSubmit}) => (
  <Fragment>
    <h1>Recherche de ressources</h1>
    <form onSubmit={handleSubmit}>
      <fieldset>
        <div className="grid-3">
          <InputField
            className="col-2"
            label={labels.titre}
            info="(Vous pouvez utiliser le symbole % comme caractère joker)"
            name="titre" />
          <SelectField
            label={labels.langue}
            values={listes.langue}
            name="langue">
            <option value="">peu importe</option>
          </SelectField>
          <ResourceTypesField
            label={labels.type}>
            <option value="">peu importe</option>
          </ResourceTypesField>
          <SelectField
            label={labels.restriction}
            values={listes.restriction}
            name="restriction" />
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
            className="col-2"
            label={labels.auteurs}
            name="auteurs" />
        </div>
      </fieldset>
      <hr />
      <Classification detailed />
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

SearchForm.propTypes = {
  handleSubmit: PropTypes.func
}

const formDef = reduxForm({
  form: 'searchForm',
  onSubmit: (query, dispatch) => dispatch(push({
    pathname: '/ressources',
    search: queryString.stringify(query)
  }))
})

const mapStateToProps = ({router: {location: {search}}}) => ({
  initialValues: Object.assign(
    {
      categories: [],
      niveaux: [],
      typePedagogiques: [],
      typeDocumentaires: [],
      langue: 'fra',
      publie: true
    },
    queryString.parse(search)
  )
})

export default connect(mapStateToProps, {})(formDef(SearchForm))
