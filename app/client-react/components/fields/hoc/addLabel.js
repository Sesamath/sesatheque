import PropTypes from 'prop-types'
import React, {Component} from 'react'

/**
 * High Order Component qui ajoute le label autour du WrappedComponent
 * @param {Component} WrappedComponent
 * @return {Component} Le composant enrichi
 */
const addLabel = (WrappedComponent, hasForAttr = true) => {
  class AddLabel extends Component {
    render () {
      const {className, label, info, name} = this.props
      const classList = ['field']
      if (className) classList.push(className)

      return (
        <div
          className={classList.join(' ') || null}
          data-fieldname={name}
        >
          <label htmlFor={hasForAttr ? `${name}-field` : null}>
            {label} {info && (<i>{info}</i>)}
          </label>
          <WrappedComponent {...this.props} />
        </div>
      )
    }
  }

  AddLabel.propTypes = {
    className: PropTypes.string,
    info: PropTypes.string,
    label: PropTypes.node,
    name: PropTypes.string
  }

  return AddLabel
}

export default addLabel
