import React, {Fragment} from 'react'
import {Field} from 'redux-form'
import CheckboxGroup from './CheckboxGroup'
import {listes} from '../../server/ressource/config'

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

const MetaForm = () => (
  <Fragment>
    <fieldset>
      <div>
        <label htmlFor="input-titre">Titre</label>
        <div>
          <Field
            id="input-titre"
            name="titre"
            component="input"
            type="text"
          />
        </div>
      </div>
      <div>
        <label htmlFor="select-type">Type technique</label>
        <div>
          <Field id="select-type" name="type" component="select">
            {Object.keys(listes.type).map(key => (
              <Fragment key={key.toString()}>
                <option value={key}>{listes.type[key]}</option>
              </Fragment>
            ))}
          </Field>
        </div>
      </div>
      <div>
        <label htmlFor="select-restriction">Restriction</label>
        <div>
          <Field id="select-restriction" name="restriction" component="select">
            {Object.keys(listes.restriction).map(key => (
              <Fragment key={key.toString()}>
                <option value={key}>{listes.restriction[key]}</option>
              </Fragment>
            ))}
          </Field>
        </div>
      </div>
      <div>
        <label htmlFor="select-langue">Langue</label>
        <div>
          <Field id="select-langue" name="langue" component="select">
            {Object.keys(listes.langue).map(key => (
              <Fragment key={key.toString()}>
                <option value={key}>{listes.langue[key]}</option>
              </Fragment>
            ))}
          </Field>
        </div>
      </div>
      <div>
        <label htmlFor="checkbox-publie">Publié</label>
        <div>
          <Field
            name="publie"
            id="checkbox-publie"
            component="input"
            type="checkbox"
            className="checkbox"
          />
        </div>
      </div>
      <div>
        <label htmlFor="input-identifiant">Identifiant</label>
        <div>
          <Field
            id="input-identifiant"
            name="identifiant"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </div>
      </div>
      <div>
        <label htmlFor="input-origine">Origine</label>
        <div>
          <Field
            id="input-origine"
            name="origine"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </div>
      </div>
      <div>
        <label htmlFor="input-idOrigine">Identifiant d'origine</label>
        <div>
          <Field
            id="input-idOrigine"
            name="idOrigine"
            component="input"
            type="text"
            props={{ disabled: true }}
          />
        </div>
      </div>
    </fieldset>
    <fieldset>
      <CheckboxGroup {...categories} />
      <CheckboxGroup {...niveaux} />
      <CheckboxGroup {...typePedagogiques} />
      <CheckboxGroup {...typeDocumentaires} />
    </fieldset>
    <fieldset>
      <div>
        <label htmlFor="input-resume">Résumé</label>
        <div>
          <Field
            id="input-resume"
            name="resume"
            component="textarea" />
        </div>
      </div>
      <div>
        <label htmlFor="input-description">Description</label>
        <div>
          <Field
            id="input-description"
            name="description"
            component="textarea" />
        </div>
      </div>
      <div>
        <label htmlFor="input-commentaires">Commentaires (réservés au formateur)</label>
        <div>
          <Field name="commentaires" component="textarea" />
        </div>
      </div>
    </fieldset>
  </Fragment>
)

export default MetaForm
