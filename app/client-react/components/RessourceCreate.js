import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {flowRight} from 'lodash'
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
              <InputField
                label={labels.titre}
                name="titre" />
              <ResourceTypesField
                label={labels.type}
              >
                <option value="">Choisir le type</option>
              </ResourceTypesField>
              <SelectField
                name="langue"
                label={labels.langue}
                values={listes.langue} />
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
          <hr />
          <fieldset>
            <div className="grid-3">
              <InputField
                label={labels.origine}
                name="origine"
              />
              <InputField
                label={labels.idOrigine}
                name="idOrigine"
              />
              <SelectField
                name="restriction"
                label={labels.restriction}
                values={listes.restriction} />
              <SwitchField
                label={labels.publie}
                name="publie" />
            </div>
          </fieldset>
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

export default flowRight([
  reduxForm({
    form: 'create-ressource',
    initialValues: {
      categories: [],
      niveaux: [],
      langue: 'fra',
      restriction: '0'
    },
    onSubmit: (values, dispatch) => {
      return dispatch(saveRessource(
        values,
        (oid) => {
          dispatch(push(`/ressource/modifier/${oid}`))
        }
      ))
    }
  })
])(RessourceCreate)
