import React, {Fragment} from 'react'
import Classification from './Classification'
import {Field} from 'redux-form'
import {listes, labels} from '../../server/ressource/config'
import InputField from './fields/InputField'
import ResourceTypesField from './fields/ResourceTypesField'
import SelectField from './fields/SelectField'
import SwitchField from './fields/SwitchField'
import TextareaField from './fields/TextareaField'

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
          label={labels.langue}
          values={listes.langue}
          name="langue" />
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
    <Classification detailled />
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
