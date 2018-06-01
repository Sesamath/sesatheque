import React, {Fragment} from 'react'
import {Field} from 'redux-form'
import CheckboxGroup from './CheckboxGroup'
import {listes, labels} from '../../server/ressource/config'

const categories = {
  name: 'categories',
  title: labels.categories,
  values: Object.values(listes.categories)
}

const niveaux = {
  name: 'niveaux',
  title: labels.niveaux,
  values: Object.values(listes.niveaux)
}

const typePedagogiques = {
  name: 'typePedagogiques',
  title: labels.typePedagogiques,
  values: Object.values(listes.typePedagogiques)
}

const typeDocumentaires = {
  name: 'typeDocumentaires',
  title: labels.typeDocumentaires,
  values: Object.values(listes.typeDocumentaires)
}

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
          <Field name="type" component="select" props={{ disabled: true }}>
            {Object.keys(listes.type).map(key => (
              <Fragment key={key.toString()}>
                <option value={key}>{listes.type[key]}</option>
              </Fragment>
            ))}
          </Field>
        </label>
        <label>
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
        <CheckboxGroup {...categories} />
        <CheckboxGroup {...niveaux} />
        <CheckboxGroup {...typePedagogiques} />
        <CheckboxGroup {...typeDocumentaires} />
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
        <label>
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
            className="checkbox"
          />
        </label>
      </div>
    </fieldset>
  </Fragment>
)

export default MetaForm
