import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React from 'react'
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

const SearchForm = (props) => {
  const {handleSubmit, isOpen, toggleForm, query} = props
  if (isOpen || !query) {
    return (
      <form onSubmit={handleSubmit}>
        <fieldset>
          <div className="grid-3">
            <InputField
              className="col-2"
              label={labels.titre}
              info="(Vous pouvez utiliser le symbole % comme caractère joker)"
              name="titre"/>
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
              name="restriction"/>
            <SwitchField
              className="center"
              label={labels.publie}
              name="publie"/>

            <InputField
              label={labels.oid}
              name="oid"/>
            <InputField
              label={labels.origine}
              name="origine"/>
            <InputField
              label={labels.idOrigine}
              name="idOrigine"/>

            <InputField
              className="col-2"
              label={labels.auteurs}
              name="auteurs"/>
          </div>
        </fieldset>
        <hr/>
        <Classification detailed/>
        <div className="buttons-area">
          <button
            type="submit"
            className="btn--primary"
          >
            Rechercher
          </button>
        </div>
      </form>
    )
  }
  // sinon on rappelle juste les critères
  return (
    <ul><a href="#" onClick={toggleForm}>Modifier</a> les critères de recherche actuels
      {Object.keys(query).map(key => (
        <li key={key}>{labels[key]} : {Array.isArray(query[key]) ? query[key].join(', ') : query[key]}</li>
      ))}
    </ul>
  )
}

const queryToSearch = (query) => {
  const compactQuery = {}
  Object.keys(query).forEach(k => {
    if (query[k] !== undefined) compactQuery[k] = query[k]
  })
  return queryString.stringify(compactQuery)
}

// pour utiliser Field faut être un redux-form
const formDef = reduxForm({
  form: 'searchForm',
  onSubmit: (query, dispatch, {toggleForm}) => {
    dispatch(push({
      pathname: '/ressource/rechercher',
      search: queryToSearch(query)
    }))
    toggleForm()
  }
})

SearchForm.propTypes = {
  toggleForm: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  query: PropTypes.object
}

export default formDef(SearchForm)
