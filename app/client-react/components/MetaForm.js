import React, {Fragment} from 'react'
import {flowRight} from 'lodash'
import {Field, reduxForm} from 'redux-form'
import CheckboxGroup from './CheckboxGroup'
import {listes} from '../../server/ressource/config'
import IEP_Editor from './IEP_Editor'
import resourceLoader from './resourceLoader'

const MetaForm = props => {
  const {handleSubmit, pristine, reset, submitting} = props

  const categories = {
    name: 'categories',
    title: 'Catégories',
    values: Object.values(listes.categories)
  }

  const niveaux = {
    name: 'niveaux',
    title: 'Niveaux',
    values: Object.values(listes.niveaux)
  }

  const typePedagogiques = {
    name: 'typePedagogiques',
    title: 'Type pédagogique',
    values: Object.values(listes.typePedagogiques)
  }

  const typeDocumentaires = {
    name: 'typeDocumentaires',
    title: 'Type documentaire',
    values: Object.values(listes.typeDocumentaires)
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <div className="grid-3">
          <label>
            Titre
            <Field
              name="titre"
              component="input"
              type="text"
            />
          </label>
          <label>
            Type technique
            <Field name="type" component="select">
                {Object.keys(listes.type).map(key => (
                  <Fragment key={key.toString()}>
                    <option value={key}>{listes.type[key]}</option>
                  </Fragment>
                ))}
            </Field>
          </label>
          <label>
            Langue
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
            Résumé
            <Field
              name="resume"
              component="textarea" />
          </label>
          <label>
            Description
            <Field
              name="description"
              component="textarea" />
          </label>
          <label>
            Commentaires (réservés au formateur)
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
            Identifiant
            <Field
              name="oid"
              component="input"
              type="text"
              props={{ disabled: true }}
            />
          </label>
          <label>
            Origine
            <Field
              name="origine"
              component="input"
              type="text"
              props={{ disabled: true }}
            />
          </label>
          <label>
            Identifiant d'origine
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
            Version
            <Field
              name="version"
              component="input"
              type="number"
              props={{ disabled: true }}
            />
          </label>
          <label>
            Date de création
            <Field
              name="dateCreation"
              component="input"
              type="text"
              props={{ disabled: true }}
            />
          </label>
          <label>
            Date de mise à jour
            <Field
              name="dateMiseAJour"
              component="input"
              type="text"
              props={{ disabled: true }}
            />
          </label>
          <label>
            Restriction
            <Field name="restriction" component="select">
              {Object.keys(listes.restriction).map(key => (
                <Fragment key={key.toString()}>
                  <option value={key}>{listes.restriction[key]}</option>
                </Fragment>
              ))}
            </Field>
          </label>
          <label>
            Publié
            <Field
              name="publie"
              component="input"
              type="checkbox"
              className="checkbox"
            />
          </label>
        </div>
      </fieldset>
      <hr />
      <fieldset>
        <IEP_Editor />
      </fieldset>
      <div className="buttons-area">
        <button type="submit" className="btn--primary" disabled={pristine || submitting}>Enregister</button>
      </div>
    </form>
  )
}

export default flowRight([
  resourceLoader,
  reduxForm({
    form: 'meta',
  })
])(MetaForm)
