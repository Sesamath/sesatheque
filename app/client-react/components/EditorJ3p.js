import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {formValues} from 'redux-form'
import Iframe from './Iframe'

class EditorJ3p extends Component {
  constructor (props) {
    super(props)
    this.exportParametersCallback = null
    this.iframe = null
    this.iframeSrc = require('../../client/plugins/j3p/editgraphe.html')
  }

  exportToJson () {
    const j3pExport = this.exportParametersCallback()
    if (j3pExport) {
      this.props.change('parametres', j3pExport)
    }
  }

  loadRessource (resource) {
    this.iframe.current.contentWindow.load(resource, (error, getRessourceParametres) => {
      if (error) return // todo: afficher "Une erreur s'est produite pendant le chargement de l'éditeur"
      this.exportParametersCallback = getRessourceParametres
    })
  }

  onLoad (iframe) {
    this.iframe = iframe
    const parametres = typeof this.props.parametres === 'string' ? JSON.parse(this.props.parametres) : this.props.parametres
    this.loadRessource({parametres})
  }

  onToggle (exitIframe) {
    if (exitIframe === true) {
      this.exportToJson()
    } else {
      this.iframe.current.src = this.iframeSrc
    }
  }

  render () {
    return (
      <fieldset>
        <Iframe
          allowManualEdition
          change={this.props.change}
          onLoad={this.onLoad.bind(this)}
          onToggle={this.onToggle.bind(this)}
          src={this.iframeSrc}
        />
      </fieldset>
    )
  }
}

EditorJ3p.propTypes = {
  change: PropTypes.func,
  parametres: PropTypes.object
}

export default formValues({parametres: 'parametres'})(EditorJ3p)
