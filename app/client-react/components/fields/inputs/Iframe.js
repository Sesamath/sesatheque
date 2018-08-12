import {get} from 'lodash'
import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import Warning from '../../Warning'

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
      names,
      ...otherProps
    } = this.props

    const fieldsArray = names.map(name => get(otherProps, name))

    return (
      <Fragment>
        <iframe
          onLoad={() => onLoad(this.iframeRef, otherProps)}
          ref={this.iframeRef}
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
}

Iframe.propTypes = {
  onLoad: PropTypes.func,
  src: PropTypes.string,
  names: PropTypes.arrayOf(PropTypes.string)
}

export default Iframe
