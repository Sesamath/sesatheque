import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React from 'react'
import {reduxForm} from 'redux-form'
import {labels} from '../../server/ressource/config'
import listes from '../utils/listesFromConfig'
import {getRestrictionString} from '../utils/labels'
import Classification from './Classification'
import {
  InputField,
  SelectField,
  SwitchField
} from './fields'
import queryString from 'query-string'

import './SearchForm.scss'

const anyOption = {
  value: '',
  label: 'peu importe'
}

const langue = [anyOption, ...listes.langue]
const type = [anyOption, ...listes.type]

const publieSelectOptions = [
  anyOption,
  {value: true, label: 'oui'},
  {value: false, label: 'non'}
]

const SearchForm = ({handleSubmit, isOpen, query, allowAnyOption}) => {
  if (isOpen) {
    return (
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
              options={allowAnyOption ? [
                anyOption,
                ...listes.restriction
              ] : listes.restriction}
              name="restriction"/>
            {allowAnyOption ? (
              <SelectField
                label={labels.publie}
                options={publieSelectOptions}
                name="publie"
              />
            ) : (
              <SwitchField
                className="center"
                label={labels.publie}
                name="publie"
              />
            )}

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
          <button type="submit" className="btn--primary">Rechercher</button>
        </div>
      </form>
    )
  }
  // sinon on rappelle juste les critères
  return (
    <div className="search-box">
      <div className="fr">
        <a href="#form">Modifier</a> les critères de recherche actuels
      </div>
      <ul className="tags">
        {Object.keys(query).map(key => {
          // les booléens et restriction doivent avoir une traduction plus parlante que leur valeur
          const criteria = query[key]
          let criteriaLabel
          if (typeof criteria === 'boolean') {
            criteriaLabel = criteria ? 'oui' : 'non'
          } else if (key === 'restriction') {
            criteriaLabel = getRestrictionString({restriction: criteria})
          } else if (Array.isArray(criteria)) {
            criteriaLabel = criteria.join(', ')
          } else {
            criteriaLabel = criteria
          }

          return (
            <li key={key}><span className="tag--info">{labels[key]} : {criteriaLabel}</span></li>
          )
        })}
      </ul>
    </div>
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
  // cf https://redux-form.com/7.4.2/docs/api/reduxform.md/#-code-enablereinitialize-boolean-code-optional-
  // sinon le form garde son état interne entre clic sur "mes ressources" puis "rechercher"
  enableReinitialize: true,
  form: 'searchForm',
  onSubmit: (query, dispatch) => {
    dispatch(push({
      pathname: '/ressource/rechercher',
      hash: '#results',
      search: queryToSearch(query)
    }))
  }
})

SearchForm.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  query: PropTypes.object,
  allowAnyOption: PropTypes.bool
}

export default formDef(SearchForm)
