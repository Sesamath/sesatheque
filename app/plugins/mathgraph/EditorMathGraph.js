import PropTypes from 'prop-types'
import React, {Fragment, Component} from 'react'
import {formValues} from 'redux-form'
import IframeHandler from 'client-react/components/IframeHandler'
import {IntegerField, SwitchField} from 'client-react/components/fields'
// page de l'éditeur mathgraph à insérer en iframe
import iframeSrc from './public/mathgraph-editor.html'

class EditorMathGraph extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showReloadMessage: false
    }
  }

  componentDidUpdate (prevProps) {
    if (
      (this.props.parametres.width !== prevProps.parametres.width) ||
      (this.props.parametres.height !== prevProps.parametres.height) ||
      (this.props.parametres.dys !== prevProps.parametres.dys)
    ) {
      this.setState({
        showReloadMessage: true
      })
    }
  }

  /**
  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTshowReloadMessageMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframe, fields) {
    // @todo vérifier que this.iframe.current existe et gérer l'erreur éventuelle
    const {parametres} = this.props
    const win = iframe.current.contentWindow
    win.load({parametres}, fields)
  }

  render () {
    return (
      <Fragment>
        <fieldset>
          <div className="grid-3">
            <IntegerField
              label="Largeur imposée"
              info="laisser vide pour s'adapter à l'écran de l'utilisateur"
              name="parametres[width]"
              min="300"
            />
            <IntegerField
              label="Hauteur imposée"
              info="laisser vide pour s'adapter à l'écran de l'utilisateur"
              name="parametres[height]"
              min="200"
            />
            <SwitchField
              label="Affichage adapté &laquo;dys&raquo;"
              name="parametres[dys]"
            />
          </div>
          {this.state.showReloadMessage ? (
            <span className="alert--warning">
              Cette modification sera visible lors du prochain affichage de cette ressource.
            </span>
          ) : null}
        </fieldset>
        <hr />
        <fieldset>
          {this.props.parametres.fig === undefined ? (
            <span className="alert--info">Pour ajouter un repère, utiliser le bouton
            &laquo;Nouvelle figure&raquo;</span>
          ) : null}
          <span className="alert--info">Vous pouvez changer les outils disponibles via le bouton &laquo;options&raquo;</span>
          <IframeHandler
            iframeNames={[
              'parametres[fig]',
              'parametres[level]',
              'parametres[isExercise]'
            ]}
            onLoad={this.onIframeLoaded.bind(this)}
            src={iframeSrc}
          />
        </fieldset>
      </Fragment>
    )
  }
}

EditorMathGraph.propTypes = {
  parametres: PropTypes.object,
  getLoadCb: PropTypes.func,
  getInfosParametres: PropTypes.func
}

export default formValues({parametres: 'parametres'})(EditorMathGraph)
