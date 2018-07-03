import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {reduxForm} from 'redux-form'
import Classification from './Classification'
import {saveRessource} from '../actions/ressource'

import {listes, labels} from '../../server/ressource/config'
import {
  InputField,
  ResourceTypesField,
  SelectField,
  SwitchField,
  TextareaField
} from './fields'

const RessourceCreate = ({
  handleSubmit,
  change,
  submitting
}) => {
  return (
    <Fragment>
      <h1>Créer une ressource</h1>
      <form onSubmit={handleSubmit}>
        <Fragment>
          <fieldset>
            <div className="grid-3">
              <InputField className="col-2"
                label={labels.titre}
                name="titre" />
              <SelectField
                name="langue"
                label={labels.langue}
                values={listes.langue} />

              <ResourceTypesField
                label={labels.type}
              >
                <option value="">Choisir le type</option>
              </ResourceTypesField>
              <SelectField
                name="restriction"
                label={labels.restriction}
                values={listes.restriction} />
              <SwitchField
                className="center"
                label={labels.publie}
                checked
                name="publie" />

              <InputField
                label={labels.origine}
                info="(Laisser vide, sauf pour une origine externe connue)"
                name="origine" />
              <InputField
                label={labels.idOrigine}
                info="(uniquement pour une ressource externe)"
                name="idOrigine" />
            </div>
          </fieldset>
          <fieldset>
            <div className="grid-3">
              <TextareaField
                label={labels.resume}
                name="resume" />
              <TextareaField
                label={labels.description}
                name="description" />
              <TextareaField
                label={labels.commentaires}
                name="commentaires" />
            </div>
          </fieldset>
          <hr />
          <Classification detailed={false} />
        </Fragment>
        <hr />
        <div className="buttons-area">
          <button
            type="submit"
            className="btn--primary"
            disabled={submitting}
          >
          Créer la ressource
          </button>
        </div>
      </form>
    </Fragment>
  )
}

RessourceCreate.propTypes = {
  handleSubmit: PropTypes.func,
  change: PropTypes.func,
  submitting: PropTypes.bool
}

const form = {
  form: 'create-ressource',
  initialValues: {
    categories: [],
    niveaux: [],
    langue: 'fra',
    publie: true,
    restriction: '0'
  },
  onSubmit: (values, dispatch) => {
    const onSave = (oid) => dispatch(push(`/ressource/modifier/${oid}`))
    dispatch(saveRessource(values, onSave))
  }
}

export default reduxForm(form)(RessourceCreate)
