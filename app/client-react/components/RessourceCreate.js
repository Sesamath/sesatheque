import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {reduxForm} from 'redux-form'
import Classification from './Classification'
import {saveRessource} from '../actions/ressource'
import {labels} from '../../server/ressource/config'
import listes from '../utils/listesFromConfig'
import {
  SelectField,
  SwitchField,
  InputField,
  TextareaField
} from './fields'
import validate from '../utils/validate'

const RessourceCreate = ({
  handleSubmit,
  submitting
}) => (
  <Fragment>
    <h1>Créer une ressource</h1>
    <form onSubmit={handleSubmit}>
      <Fragment>
        <fieldset>
          <div className="grid-3">
            <InputField
              className="col-2"
              label={labels.titre}
              name="titre"
            />
            <SelectField
              label={labels.langue}
              name="langue"
              options={listes.langue}
            />
            <SelectField
              label={labels.type}
              name="type"
              placeholder="Choisir le type"
              options={listes.editableTypes}
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
              label={labels.origine}
              info="(Laisser vide, sauf pour une origine externe connue)"
              name="origine"
            />
            <InputField
              label={labels.idOrigine}
              info="(uniquement pour une ressource externe)"
              name="idOrigine"
            />
          </div>
        </fieldset>
        <fieldset>
          <div className="grid-3">
            <TextareaField
              label={labels.resume}
              name="resume"
            />
            <TextareaField
              label={labels.description}
              name="description" />
            <TextareaField
              label={labels.commentaires}
              name="commentaires"
            />
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

RessourceCreate.propTypes = {
  handleSubmit: PropTypes.func,
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
  },
  validate
}

export default reduxForm(form)(RessourceCreate)
