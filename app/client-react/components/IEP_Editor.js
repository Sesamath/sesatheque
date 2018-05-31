import React, {Component} from 'react'
import {formValues, Field} from 'redux-form'
import ShowError from './ShowError'

const importErrorMessage = 'Une erreur s\'est produite durant l\'importation du script'

class IEP_Editor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      importError: null
    }
    this.importScript = this.importScriptInner.bind(this)
  }

  importScriptInner() {
    const {url, change} = this.props
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw Error(reponse.statusText)
        }

        return response.text()
      })
      .then(content => change('parametres[xml]', content))
      .catch(error => {
        const importError = Error(`${importErrorMessage} (${error.message})`)

        this.setState({
          importError
        }, () => {
          setTimeout(() => this.setState({
            importError: null
          }), 5000)
        })
      })
  }

  render() {
    return (
      <fieldset>
        <div className="grid-3">
          <label>largeur (en pixel)
            <Field
              name="parametres[width]"
              component="input"
              type="number"
            />
          </label>
          <label>hauteur (en pixel)
            <Field
              name="parametres[height]"
              component="input"
              type="number"
            />
          </label>
          <label>url (ira lire le script de cette url à chaque affichage si le champ xml est vide)
            <Field
              id="parametres-url"
              name="parametres[url]"
              component="input"
              type="url"
            />
          </label>
        </div>
        <div>
          <button type="button" onClick={this.importScript}>importer le script</button>
          <span>(une fois pour toute, si la source change ou disparait cette ressource restera identique)</span>
          <ShowError error={this.state.importError} />
        </div>
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

export default formValues({url: 'parametres[url]'})(IEP_Editor)
