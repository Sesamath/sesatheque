import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {formValues} from 'redux-form'
import {SelectField} from 'client-react/components/fields'
import IframeHandler from 'client-react/components/IframeHandler'
// page de l'éditeur ecjs à insérer en iframe
import iframeSrc from './public/edit.html'
import typesEcjs from './subtypes'

class EditorEcjs extends Component {
  /**
   * Appelée par le onLoad de l'iframe
   * @param {HTMLElement} iframe Iframe présente dans le DOM
   */
  onIframeLoaded (iframeRef, fields) {
    // on stocke une ref sur l'iframe
    this.iframeRef = iframeRef
    this.fields = fields
    this.loadResourceInEditor()
  }

  loadResourceInEditor (fields) {
    if (!this.iframeRef.current) {
      console.error(Error(`Impossible de charger une ressource avant d'avoir chargé l'iframe`))
      return
    }
    const parametres = this.props.parametres
    // on appelle (en global dans l'iframe) load(ressource, cb) qui rappellera cb(getParametres)
    this.iframeRef.current.contentWindow.load({parametres}, this.fields)
  }

  /**
   * Retourne true s'il faut refaire un rendu (si fichierjs a changé)
   * @see https://reactjs.org/docs/react-component.html#shouldcomponentupdate
   * @param {object} nextProps
   * @return {boolean}
   */
  shouldComponentUpdate (nextProps) {
    return nextProps.parametres.fichierjs !== this.props.parametres.fichierjs
    // Normalement le seul cas où il faut relancer un render, c'est si y'avait pas de fichierjs
    // et qu'il va y en avoir un (le contraire devrait pas être possible mais renverrait true aussi)
    // donc avec la condition ci-dessous
    // return Boolean(nextProps.parametres.fichiersjs) !== Boolean(this.props.parametres.fichiersjs)

    // car si fichierjs change d'une valeur à une autre c'est inutile de refaire un rendu de la même chose
    // mais il faudrait appeler le load ici (et pas dans componentDidUpdate qui ne serait alors pas appelé) alors que les props n'ont pas encore été mise à jour
    // on préfère gaspiller qq rendus pour appeler le load de l'iframe dans componentDidUpdate avec les props à jour
  }

  /**
   * Appelé après une modif des props ou du state (après render s'il y en a eu un, mais pas après le 1er render)
   * Rappelle la méthode load dans l'iframe si fichierjs a changé
   * @see https://reactjs.org/docs/react-component.html#componentdidupdate
   * @param prevProps
   */
  componentDidUpdate (prevProps) {
    if (prevProps.parametres.fichierjs !== this.props.parametres.fichierjs) {
      this.loadResourceInEditor()
    }
  }

  render () {
    // et on retourne select + editor
    return (
      <Fragment>
        <SelectField
          label="Type d’exercice"
          name="parametres[fichierjs]"
          options={typesEcjs.map(typeEcjs => ({
            label: typeEcjs,
            value: typeEcjs
          }))}
          placeholder="Choisir un type d’exercice"
        />
        {this.props.parametres.fichierjs ? (
          <fieldset>
            <IframeHandler
              onLoad={this.onIframeLoaded.bind(this)}
              src={iframeSrc}
              iframeNames={['parametres[options]']}
            />
          </fieldset>
        ) : null}
      </Fragment>
    )
  }
}

EditorEcjs.propTypes = {
  // prop fournie par formValue:
  parametres: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ])
}

export default formValues({
  parametres: 'parametres'
})(EditorEcjs)
