import {listes, labels} from '../../server/ressource/config'
import {reduxForm} from 'redux-form'
import Classification from './Classification'
import InputField from './fields/InputField'
import MetaForm from './MetaForm'
import NavMenu from './NavMenu'
import React, {Fragment} from 'react'
import ResourceTypesField from './fields/ResourceTypesField'
import SelectField from './fields/SelectField'

const publieValues = {
  'true': 'Oui',
  'false': 'Non'
}

const SearchForm = ({history}) => (
  <Fragment>
    <h1>Recherche de ressources</h1>
    <NavMenu history={history} />
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
            optional />
          <SelectField
            label={labels.publie}
            values={publieValues}
            optional />
        </div>
      </fieldset>
      <hr />
      <Classification detailled />
      <div className="buttons-area">
        <button
        type="button"
        className="btn--primary"
        onClick={(e) => {
            e.persist()
            return null
        }}
        >
        Rechercher
        </button>
      </div>
    </form>
  </Fragment>
)

export default reduxForm({
  form: 'searchForm'
})(SearchForm)
