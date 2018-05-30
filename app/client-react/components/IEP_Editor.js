import React, {Component} from 'react'
import {formValues, Field} from 'redux-form'
import {handleErrors} from '../utils/httpMethods'

class IEP_Editor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      error: null
    }
    this.importScript = this.importScriptInner.bind(this)
  }

  importScriptInner() {
    const {url, change} = this.props
    fetch(url)
      .then(handleErrors)
      .then((response) => response.text())
      .then((content) => change('parametres[xml]', content))
      .catch((error) => {
        this.setState({
          error
        }, () => {
          setTimeout(() => this.setState({
            error: null
          }), 5000)
        })
      })
  }

  render() {
    return (
      <div>
        <label htmlFor="iep-editor-width">largeur (en pixel)</label>
        <div>
          <Field
            id="iep-editor-width"
            name="parametres[width]"
            component="input"
            type="number"
          />
        </div>
        <label htmlFor="iep-editor-height">hauteur (en pixel)</label>
        <div>
          <Field
            id="iep-editor-height"
            name="parametres[height]"
            component="input"
            type="number"
          />
        </div>
        <label htmlFor="parametres-url">url (ira lire le script de cette url à chaque affichage si le champ xml est vide)</label>
        <div>
          <Field
            id="parametres-url"
            name="parametres[url]"
            component="input"
            type="url"
          />
        </div>
        <div>
          <button type="button" onClick={this.importScript}>importer le script</button>(une fois pour toute, si la source change ou disparait cette ressource restera identique)
        </div>
        {this.state.error ? (
          <div className="error">
            {this.state.error.toString()}
          </div>
        ): null
        }
        <label htmlFor="parametres-xml">Script instrumenpoche</label>
        <div>
          <Field
            id="parametres-xml"
            name="parametres[xml]"
            component="textarea"
            cols="80"
            rows="20"
          />
        </div>
      </div>
    )
  }
}

export default formValues({url: 'parametres[url]'})(IEP_Editor)
