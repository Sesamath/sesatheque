import React, {Fragment} from 'react'
import Classification from './Classification'
import {labels} from '../../server/ressource/config'
import listes from '../utils/listesFromConfig'
import {
  DateField,
  SelectField,
  SwitchField,
  TextareaField,
  InputField
} from './fields'

const MetaForm = () => (
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
          disabled
          options={listes.type}
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
          name="oid"
          disabled
        />
        <InputField
          label={labels.origine}
          name="origine"
          disabled
        />
        <InputField
          label={labels.idOrigine}
          name="idOrigine"
          disabled
        />
        <InputField
          label={labels.version}
          name="version"
          disabled
        />
        <DateField
          label={labels.dateCreation}
          name="dateCreation"
          disabled
        />
        <DateField
          label={labels.dateMiseAJour}
          name="dateMiseAJour"
          disabled
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
  </Fragment>
)

export default MetaForm
