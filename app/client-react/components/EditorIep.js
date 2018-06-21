import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues, Field} from 'redux-form'
import addNotifyToProps from '../utils/addNotifyToProps'
import ShowError from './ShowError.js'

const importErrorMessage = 'Une erreur s’est produite durant l’importation du script'

class EditorIep extends Component {
  constructor (props) {
    super(props)
    // on teste l'objet window car ce composant pourrait être utilisé pour du rendu coté serveur
    this.isOnHttps = true || typeof window !== 'undefined' && window.location.protocol === 'https:'
    // un timer pour debounce le onUrlChange
    this.urlChangeTimer = null
    // un raccourci binded
    this.importScript = this.importScriptInner.bind(this)
  }

  importScriptInner () {
    const {url, change, notify} = this.props
    // si c'est du https on fetch direct, sinon dans le doute on passe par notre proxy
    let urlToFetch = url
    if (this.isOnHttps && !/^https:\/\//.test(url)) urlToFetch = `/ressource/urlProxy/${encodeURIComponent(url)}`
    fetch(urlToFetch)
      .then(response => {
        if (!response.ok) throw Error(response.statusText)
        return response.text()
      })
      .then(content => change('parametres[xml]', content))
      .then(() => {
        notify({
          level: 'info',
          message: 'Le script a été correctement importé'
        })
      })
      .catch(error => {
        notify({
          level: 'error',
          message: `${importErrorMessage}: ${error.message}`
        })
      })
  }

  getHttpsAvert () {
    const {url} = this.props
    if (url) {
      const isHttpsUrl = (url.indexOf('https://') === 0)
      if (this.isOnHttps && !isHttpsUrl) return Error(`Impossible de charger dynamiquement un script http sur un site https, vous devez l'importer pour que cela fonctionne`)
    }
    return null
  }

  render () {
    const httpsError = this.getHttpsAvert()
    return (
      <fieldset>
        <div className="grid-3">
          <label>Largeur <i>(en pixel)</i>
            <Field
              name="parametres[width]"
              component="input"
              type="number"
            />
          </label>
          <label>Hauteur <i>(en pixel)</i>
            <Field
              name="parametres[height]"
              component="input"
              type="number"
            />
          </label>
        </div>
        <div className="grid-3">
          <label>Url <i>(ira lire le script de cette url le champ xml est vide)</i>
            <Field
              id="parametres-url"
              name="parametres[url]"
              component="input"
              type="url"
            />
          </label>
          <label>
            <br />
            <button type="button" onClick={this.importScript}>Importer le script</button>
            <span className="note">(Si la source change ou disparait cette ressource restera identique)</span>
          </label>
        </div>
        <ShowError error={httpsError} />
        <div>
          <label>Script instrumenpoche
            <Field
              id="parametres-xml"
              name="parametres[xml]"
              component="textarea"
              cols="80"
              rows="20"
            />
          </label>
        </div>
      </fieldset>
    )
  }
}

EditorIep.propTypes = {
  url: PropTypes.string,
  change: PropTypes.func,
  notify: PropTypes.func
}

// on wrap dans reduxForm puis addNotify
const formComponent = formValues({url: 'parametres[url]'})(EditorIep)
export default addNotifyToProps(formComponent)
