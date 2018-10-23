import {push} from 'connected-react-router'
import {Prompt} from 'react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {reduxForm} from 'redux-form'
import {parse} from 'query-string'
import getEditor from 'plugins/editors'

import Classification from './Classification'
import {labels} from '../../server/ressource/config'
import onSubmitFail from '../utils/onSubmitFail'
import listes from '../utils/listesFromConfig'
import resourceSaver from '../hoc/resourceSaver'
import ensureLogged from '../hoc/ensureLogged'

import {
  SelectField,
  SwitchField,
  InputField,
  TextareaField
} from './fields'
import validate from '../utils/ressourceValidate'

const ResourceCreate = ({
  handleSubmit,
  personne: {permissions: createAll},
  pristine,
  submitting,
  submitSucceeded
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
              options={listes[createAll ? 'type' : 'editableTypes']}
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
    <Prompt
      when={!pristine && !submitSucceeded}
      message="Il existe des changements non sauvegardés sur le formulaire, êtes vous sûr de vouloir changer de page ?"
    />
  </Fragment>
)

ResourceCreate.propTypes = {
  handleSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  submitSucceeded: PropTypes.bool,
  personne: PropTypes.shape({
    permissions: PropTypes.object.isRequired
  }).isRequired,
  pristine: PropTypes.bool
}

const form = {
  form: 'create-ressource',
  initialValues: {
    categories: [],
    niveaux: [],
    langue: 'fra',
    publie: true,
    restriction: 0
  },
  onSubmit: (values, dispatch, {
    saveRessource
  }) => {
    // si on nous passe un closerId, faut le refiler à la page modifier, c'est elle qui fera le postMessage
    const {closerId} = parse(window.location.search)
    const search = closerId ? `?closerId=${closerId}` : ''
    const onSave = ({oid}) => dispatch(push(`/ressource/modifier/${oid}${search}`))
    const {type} = values
    const {defaultValue = {}} = getEditor(type)
    const ressourceData = {
      ...defaultValue,
      ...values
    }
    saveRessource(ressourceData, onSave)
  },
  onSubmitFail,
  validate
}

export default ensureLogged(
  resourceSaver(
    reduxForm(form)(ResourceCreate)
  )
)
