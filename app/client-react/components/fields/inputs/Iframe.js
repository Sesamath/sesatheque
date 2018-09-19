import PropTypes from 'prop-types'
import React, {Component} from 'react'
import showInvalidField from '../hoc/showInvalidField'

class Iframe extends Component {
  constructor (props) {
    super(props)
    /**
    * Référence React vers l'iframe
    * @type {React.Ref}
    * @see https://reactjs.org/docs/refs-and-the-dom.html
    */
    this.iframeRef = React.createRef()
  }

  render () {
    const {
      onLoad,
      src,
      input
    } = this.props

    return (
      <iframe
        allowFullScreen
        onLoad={() => onLoad(this.iframeRef, input)}
        ref={this.iframeRef}
        src={src}
      />
    )
  }
}

Iframe.propTypes = {
  input: PropTypes.shape({}),
  onLoad: PropTypes.func,
  src: PropTypes.string,
  names: PropTypes.arrayOf(PropTypes.string)
}

export default showInvalidField(Iframe)
