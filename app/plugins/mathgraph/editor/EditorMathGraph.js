import PropTypes from 'prop-types'
import React, {Fragment, Component} from 'react'
import {formValues} from 'redux-form'
import {IframeField, IntegerField, SwitchField} from 'client-react/components/fields'
import {version} from '../../../../package'

// page de l'éditeur mathgraph à insérer en iframe (copiée par webpack)
const iframeSrc = `/plugins/mathgraph/mathgraph-editor.html?${version}`

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
    const isFigEmpty = !this.props.parametres.content || this.props.parametres.content.fig === undefined

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
            <SwitchField
              label="Afficher à l'élève le bouton &laquo;nouvelle figure&raquo;"
              name="parametres[newFig]"
            />
            <SwitchField
              label="Afficher à l'élève le bouton &laquo;ouvrir&raquo;"
              name="parametres[open]"
            />
          </div>
          {this.state.showReloadMessage ? (
            <div className="alert--warning">
              Cette modification sera visible lors du prochain affichage de cette ressource.
            </div>
          ) : null}
        </fieldset>
        <hr />
        <IframeField
          label="Édition du contenu MathGraph"
          name="parametres[content]"
          onLoad={this.onIframeLoaded.bind(this)}
          src={iframeSrc}
        >
          {isFigEmpty ? (
            <div className="alert--info">Pour ajouter un repère, utiliser le bouton
            &laquo;Nouvelle figure&raquo;</div>
          ) : null}
          <div className="alert--info">Vous pouvez changer les outils disponibles via le bouton &laquo;options&raquo;</div>
        </IframeField>
      </Fragment>
    )
  }
}

EditorMathGraph.propTypes = {
  parametres: PropTypes.object
}

export default formValues({parametres: 'parametres'})(EditorMathGraph)
