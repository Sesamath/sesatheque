import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import {reduxForm} from 'redux-form'
import {labels} from '../../server/ressource/config'
import listes from '../utils/listesFromConfig'
import Classification from './Classification'
import {
  SelectField,
  InputField,
  SwitchField
} from './fields'
import queryString from 'query-string'

const anyOption = {
  value: '',
  label: 'peu importe'
}

const langue = [anyOption, ...listes.langue]
const type = [anyOption, ...listes.type]

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
            name="langue"
            options={langue}
          />
          <SelectField
            label={labels.type}
            name="type"
            options={type}
          />
          <SelectField
            label={labels.restriction}
            name="restriction"
            options={listes.restriction}
          />
          <SwitchField
            className="center"
            label={labels.publie}
            name="publie"
          />
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

const arrayValues = ['categories', 'niveaux', 'typePedagogiques', 'typeDocumentaires']

const integerArrayValues = ['categories', 'typePedagogiques', 'typeDocumentaires']

const parseQuery = (search) => {
  const parsedQuery = queryString.parse(search)
  const {publie} = parsedQuery
  if (publie) {
    parsedQuery.publie = (publie === 'true')
  }

  arrayValues.forEach(prop => {
    const item = parsedQuery[prop]
    if (item !== undefined && !Array.isArray(item)) {
      parsedQuery[prop] = [item]
    }
  })

  integerArrayValues.forEach(prop => {
    const item = parsedQuery[prop]
    if (item !== undefined) {
      parsedQuery[prop] = item.map((str) => parseInt(str, 10))
    }
  })

  return parsedQuery
}

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
    parseQuery(search)
  )
})

export default connect(mapStateToProps, {})(formDef(SearchForm))
