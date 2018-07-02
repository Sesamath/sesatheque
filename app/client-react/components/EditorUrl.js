import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues, Field} from 'redux-form'

import {IntegerField} from './fields'
import ShowError from './ShowError.js'

const avertMessage = 'Impossible de charger une page http dans une page https, elle sera ouverte dans un autre onglet (donc consigne et réponse ne pourront pas être superposé à son contenu)'

const options = [
  {key: 'off', value: 'Aucune'},
  {key: 'before', value: 'Avant'},
  {key: 'while', value: 'Pendant'},
  {key: 'after', value: 'Après'}
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
      if (this.isOnHttps && !isHttpsUrl) return avertMessage
    }
    return null
  }

  hasConsigne () {
    return this.props.questionOption !== 'off'
  }

  render () {
    const httpsError = this.getHttpsAvert()
    console.log('render ', this.hasConsigne(), this.props.questionOption)
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
          {options.map(({key, value}) => (
            <label key={key}>
              <Field
                name="parametres[question_options]"
                className="radio"
                component="input"
                type="radio"
                value={key}
              /> {value} {key !== 'off' && (<i>(l’affichage de la page)</i>)}
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
          {options.map(({key, value}) => (
            <label key={key}>
              <Field
                name="parametres[answer_option]"
                className="radio"
                component="input"
                type="radio"
                value={key}
              /> {value} {key !== 'off' && (<i>(l’affichage de la page)</i>)}
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
  questionOption: 'parametres[answer_option]',
  url: 'parametres[adresse]'
}

export default formValues(propsFromFormValues)(EditorUrl)
