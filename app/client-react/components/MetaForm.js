import React from 'react'
import {Field, reduxForm} from 'redux-form'
import {categories, niveaux, typePedagogiques, typeDocumentaires} from '../constantes'
import CheckboxGroup from './CheckboxGroup'

const MetaForm = props => {
  const {handleSubmit, pristine, reset, submitting} = props

  return (
    <form onSubmit={handleSubmit}>
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
          <label htmlFor="input-type">Type technique</label>
          <div>
            <Field
              id="input-type"
              name="type"
              component="input"
              type="text"
            />
          </div>
        </div>
        <div>
          <label htmlFor="select-restriction">Restriction</label>
          <div>
            <Field id="select-restriction" name="restriction" component="select">
              <option value="0">Aucune</option>
              <option value="1">Corrigé</option>
              <option value="2">Groupe</option>
              <option value="3">Privé</option>
            </Field>
          </div>
        </div>
        <div>
          <label htmlFor="select-langue">Langue</label>
          <div>
            <Field id="select-langue" name="langue" component="select">
              <option value="deu">Allemand</option>
              <option value="eng">Anglais</option>
              <option value="ara">Arabe</option>
              <option value="eus">Basque</option>
              <option value="bre">Breton</option>
              <option value="cat">Catalan</option>
              <option value="spa">Espagnol</option>
              <option value="fra">Français</option>
              <option value="ita">Italien</option>
              <option value="por">Portugais</option>
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
      <div>
        <button type="submit" className="btn--primary" disabled={pristine || submitting}>Enregister</button>
      </div>
    </form>
  )
}

export default reduxForm({
  form: 'meta',
})(MetaForm)
