import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import {IntegerField, InputField, TextField} from 'client-react/components/fields'
import addNotifyToProps from 'client-react/hoc/addNotifyToProps'
import ShowError from 'client-react/components/ShowError.js'

const importErrorMessage = 'Une erreur s’est produite durant l’importation du script'

/**
 * Éditeur des paramètres d'une ressource iep
 */
class EditorIep extends Component {
  constructor (props) {
    super(props)
    // on teste l'objet window car ce composant pourrait être utilisé pour du rendu coté serveur
    this.isOnHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
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
          <IntegerField
            label="Largeur"
            info="(en pixel)"
            name="parametres[width]"
          />
          <IntegerField
            label="Hauteur"
            info="(en pixel)"
            name="parametres[height]"
          />
        </div>
        <div className="grid-3">
          <InputField
            label="Url"
            info="(ira lire le script de cette url le champ xml est vide)"
            name="parametres[url]"
            type="url"
          />
          <label>
            <br />
            <button type="button" onClick={this.importScript.bind(this)}>Importer le script</button>
            <span className="note">(Si la source change ou disparait cette ressource restera identique)</span>
          </label>
        </div>
        <ShowError error={httpsError} />
        <TextField
          label="Script instrumenpoche"
          name="parametres[xml]"
          mode="xml"
        />
      </fieldset>
    )
  }
}

EditorIep.propTypes = {
  /** L'url du script */
  url: PropTypes.string,
  /** Pour modifier parametres[xml] (fourni par le wrapper formValues de redux-form) */
  change: PropTypes.func,
  /** Pour les notifications (fourni par le wrapper addNotifyToProps) */
  notify: PropTypes.func
}

// on extrait en props la valeur d'un champ
// puis on wrappe dans addNotify:
export default addNotifyToProps(
  formValues({url: 'parametres[url]'})(EditorIep)
)
