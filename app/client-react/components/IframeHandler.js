import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Fields} from 'redux-form'
import {TextField} from './fields'
import Warning from './Warning'

const Iframe = ({
  root,
  onLoad,
  src,
  names,
  ...otherProps
}) => {
  /**
   * Référence React vers l'iframe
   * @type {React.Ref}
   * @see https://reactjs.org/docs/refs-and-the-dom.html
   */
  const iframeRef = React.createRef()
  const fieldsArray = (names.length === 1) ? [otherProps[root]] : Object.entries(otherProps[root]).map(([_, val]) => val)

  return (
    <Fragment>
      <iframe
        onLoad={() => onLoad(iframeRef, otherProps[root])}
        ref={iframeRef}
        src={src}
      />
      {
        fieldsArray.map(({
          meta: {touched, error, warning},
          input: {name}
        }) => {
          if (touched && (error || warning)) {
            return (<Warning
              message={error || warning}
              key={name}
            />)
          }

          return null
        })
      }
    </Fragment>
  )
}

Iframe.propTypes = {
  root: PropTypes.string,
  onLoad: PropTypes.func,
  src: PropTypes.string,
  names: PropTypes.arrayOf(PropTypes.string)
}

class IframeHandler extends Component {
  constructor (props) {
    super(props)

    this.state = {
      manualEdition: false,
      disableEditor: false
    }
  }

  onManualEditorChange (annotations) {
    if (annotations.length === 0) return this.setState({disableEditor: false})

    let hasErrors = annotations.find(a => a.type === 'error') !== undefined
    this.setState({disableEditor: hasErrors})
  }

  /**
   * Appelée lors d'une bascule de l'éditeur (manuel / graphique)
   * @param {bool} toManual vaut true lors d'une transition graphique => manuel
   */
  toggleManualEditor (toManual) {
    if (this.state.manualEdition === toManual) return

    this.setState({
      manualEdition: toManual
    })
  }

  render () {
    return (
      <fieldset>
        {this.props.allowManualEdition ? (
          <nav className="tabs-menu">
            <button
              type="button"
              onClick={this.toggleManualEditor.bind(this, true)}
              className={!this.state.manualEdition ? 'btn' : 'btn selected'}>Mode texte</button>
            <button
              type="button"
              onClick={this.toggleManualEditor.bind(this, false)}
              className={this.state.manualEdition ? 'btn' : 'btn selected'}
              disabled={this.state.disableEditor}>Éditeur graphique</button>
          </nav>
        ) : null}
        {this.props.allowManualEdition && this.state.manualEdition ? (
          <TextField
            mode="json"
            label="Paramètres"
            name={this.props.name || 'parametres'}
            onValidate={this.onManualEditorChange.bind(this)}
          />
        ) : (
          <Fields
            names={this.props.names}
            root={this.props.root}
            onLoad={this.props.onLoad}
            src={this.props.src}
            component={Iframe}
          />
        )}
      </fieldset>
    )
  }
}

IframeHandler.propTypes = {
  allowManualEdition: PropTypes.bool,
  src: PropTypes.string,
  onLoad: PropTypes.func,
  setUpdateStoreFromEditor: PropTypes.func,
  updateStoreFromEditor: PropTypes.func,
  name: PropTypes.string,
  root: PropTypes.string,
  names: PropTypes.arrayOf(PropTypes.string)
}

export default IframeHandler
