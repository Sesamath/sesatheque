import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues, Field} from 'redux-form'

import {IntegerField} from './fields'
import ShowError from './ShowError.js'

const avertMessage = 'Impossible de charger une page http dans une page https, elle sera ouverte dans un autre onglet (donc consigne et réponse ne pourront pas être superposé à son contenu)'

const questionOptions = [
  {key: 'off', label: 'Aucune'},
  {key: 'before', label: 'Avant'},
  {key: 'while', label: 'Pendant'},
  {key: 'after', label: 'Après'}
]
const answerOptions = [
  {key: 'off', label: 'Aucune'},
  {key: 'question', label: 'Avec la consigne'},
  {key: 'while', label: 'Pendant'},
  {key: 'after', label: 'Après'}
]

class EditorUrl extends Component {
  constructor (props) {
    super(props)
    // on teste l'objet window car ce composant pourrait être utilisé pour du rendu coté serveur
    this.isOnHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  }

  getHttpsAvert () {
    const {url} = this.props
    if (url) {
      const isHttpsUrl = (url.indexOf('https://') === 0)
      if (this.isOnHttps && !isHttpsUrl) return Error(avertMessage)
    }
    return null
  }

  hasConsigne () {
    return this.props.questionOption !== 'off'
  }

  render () {
    const httpsError = this.getHttpsAvert()
    return (
      <fieldset>
        <div className="grid-3">
          <label>Url de la page externe
            <Field
              id="parametres-adresse"
              name="parametres[adresse]"
              component="input"
              type="url"
            />
          </label>
        </div>
        <ShowError error={httpsError} />
        <div className="grid-3">
          <label>Largeur <i>(en pixel, laisser vide pour s’adapter à l’écran)</i>
            <IntegerField
              name="parametres[largeur]"
            />
          </label>
          <label>Hauteur <i>(en pixel, laisser vide pour s’adapter à l’écran)</i>
            <IntegerField
              name="parametres[hauteur]"
            />
          </label>
        </div>
        <div>Consigne
          {questionOptions.map(({key, label}) => (
            <label key={key}>
              <Field
                name="parametres[question_options]"
                className="radio"
                component="input"
                type="radio"
                value={key}
              /> {label} {key !== 'off' && (<i>(l’affichage de la page)</i>)}
            </label>
          ))}
          {this.hasConsigne() ? (
            <label>Texte de la consigne
              <Field
                id="parametres-consigne"
                name="parametres[consigne]"
                component="textarea"
                cols="80"
                rows="20"
              />
            </label>
          ) : null }
        </div>
        <div>Réponse
          {answerOptions.map(({key, label}) => (
            <label key={key}>
              <Field
                name="parametres[answer_option]"
                className="radio"
                component="input"
                type="radio"
                value={key}
              /> {label}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
}

EditorUrl.propTypes = {
  url: PropTypes.string,
  questionOption: PropTypes.string
}

const propsFromFormValues = {
  questionOption: 'parametres[question_options]',
  url: 'parametres[adresse]'
}

export default formValues(propsFromFormValues)(EditorUrl)
