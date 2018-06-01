import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues, Field} from 'redux-form'
import ShowError from './ShowError'

const importErrorMessage = 'Une erreur s\'est produite durant l\'importation du script'

class EditorIep extends Component {
  constructor (props) {
    super(props)
    this.state = {
      importError: null
    }
    this.importScript = this.importScriptInner.bind(this)
  }

  importScriptInner () {
    const {url, change} = this.props
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
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

  render () {
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
          </label>
        </div>
        <ShowError error={this.state.importError} />
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
  change: PropTypes.func
}

export default formValues({url: 'parametres[url]'})(EditorIep)
