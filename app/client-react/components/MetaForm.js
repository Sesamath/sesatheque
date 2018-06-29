import React, {Fragment} from 'react'
import Classification from './Classification'
import {listes, labels} from '../../server/ressource/config'
import {
  InputField,
  ResourceTypesField,
  SelectField,
  SwitchField,
  TextareaField
} from './fields'

const MetaForm = () => (
  <Fragment>
    <fieldset>
      <div className="grid-3">
        <InputField
          label={labels.titre}
          name="titre" />
        <ResourceTypesField
          label={labels.type}
          disabled />
        <SelectField
          name="langue"
          label={labels.langue}
          values={listes.langue}
        />
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
    <Classification detailed />
    <hr />
    <fieldset>
      <div className="grid-3">
        <InputField
          label={labels.oid}
          name="oid"
          disabled />
        <InputField
          label={labels.origine}
          name="origine"
          disabled />
        <InputField
          label={labels.idOrigine}
          name="idOrigine"
          disabled />
        <InputField
          label={labels.version}
          name="version"
          disabled />
        <InputField
          label={labels.dateCreation}
          name="dateCreation"
          disabled />
        <InputField
          label={labels.dateMiseAJour}
          name="dateMiseAJour"
          disabled />
        <SelectField
          label={labels.restriction}
          values={listes.restriction}
          name="restriction" />
        <SwitchField
          label={labels.publie}
          name="publie" />
      </div>
    </fieldset>
  </Fragment>
)

export default MetaForm
