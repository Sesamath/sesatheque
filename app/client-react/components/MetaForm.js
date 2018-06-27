import React, {Fragment} from 'react'
import {Field} from 'redux-form'
import CheckboxGroup from './CheckboxGroup'
import {editable, listes, listesOrdonnees, labels} from '../../server/ressource/config'

const categories = {
  name: 'categories',
  title: labels.categories,
  values: Object.entries(listes.categories)
}

const niveaux = {
  name: 'niveaux',
  title: labels.niveaux,
  values: listesOrdonnees.niveaux.map(n => [n, listes.niveaux[n]])
}

const typePedagogiques = {
  name: 'typePedagogiques',
  title: labels.typePedagogiques,
  values: listesOrdonnees.typePedagogiques.map(n => [n, listes.typePedagogiques[n]])
}

const typeDocumentaires = {
  name: 'typeDocumentaires',
  title: labels.typeDocumentaires,
  values: listesOrdonnees.typeDocumentaires.map(n => [n, listes.typeDocumentaires[n]])
}

const types = {}
Object.keys(editable).forEach(k => {
  if (editable[k]) types[k] = listes.type[k]
})

const parseInteger = (string) => parseInt(string, 10)

const MetaForm = () => (
  <Fragment>
    <fieldset>
      <div className="grid-3">
        <label>
          {labels.titre}
          <Field
            name="titre"
            component="input"
            type="text"
          />
        </label>
        <label>
          {labels.type}
          <Field
            name="type"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </label>
        <label className="select">
          {labels.langue}
          <Field name="langue" component="select">
            {Object.keys(listes.langue).map(key => (
              <Fragment key={key.toString()}>
                <option value={key}>{listes.langue[key]}</option>
              </Fragment>
            ))}
          </Field>
        </label>
      </div>
      <div className="grid-3">
        <label>
          {labels.resume}
          <Field
            name="resume"
            component="textarea" />
        </label>
        <label>
          {labels.description}
          <Field
            name="description"
            component="textarea" />
        </label>
        <label>
          {labels.commentaires}
          <Field
            name="commentaires"
            component="textarea" />
        </label>
      </div>
    </fieldset>
    <hr />
    <fieldset>
      <div className="grid-4">
        <Field
          parseValue={parseInteger}
          component={CheckboxGroup}
          {...categories}
        />
        <Field
          component={CheckboxGroup}
          {...niveaux}
        />
        <Field
          parseValue={parseInteger}
          component={CheckboxGroup}
          {...typePedagogiques}
        />
        <Field
          parseValue={parseInteger}
          component={CheckboxGroup}
          {...typeDocumentaires}
        />
      </div>
    </fieldset>
    <hr />
    <fieldset>
      <div className="grid-3">
        <label>
          {labels.oid}
          <Field
            name="oid"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </label>
        <label>
          {labels.origine}
          <Field
            name="origine"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </label>
        <label>
          {labels.idOrigine}
          <Field
            name="idOrigine"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </label>
      </div>
      <div className="grid-3">
        <label>
          {labels.version}
          <Field
            name="version"
            component="input"
            type="number"
            props={{ disabled: true }}
          />
        </label>
        <label>
          {labels.dateCreation}
          <Field
            name="dateCreation"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </label>
        <label>
          {labels.dateMiseAJour}
          <Field
            name="dateMiseAJour"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </label>
        <label className="select">
          {labels.restriction}
          <Field name="restriction" component="select">
            {Object.keys(listes.restriction).map(key => (
              <Fragment key={key.toString()}>
                <option value={key}>{listes.restriction[key]}</option>
              </Fragment>
            ))}
          </Field>
        </label>
        <label>
          {labels.publie}
          <Field
            name="publie"
            component="input"
            type="checkbox"
            className="switch"
          />
        </label>
      </div>
    </fieldset>
  </Fragment>
)

export default MetaForm
