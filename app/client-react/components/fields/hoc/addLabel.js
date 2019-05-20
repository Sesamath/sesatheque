import PropTypes from 'prop-types'
import React, {Component} from 'react'
import getDisplayName from '../../../utils/getDisplayName'

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
          className={classList.join(' ')}
        >
          <label htmlFor={hasForAttr ? `${name}-field` : null}>
            {label} {info && (<i>{info}</i>)}
          </label>
          <WrappedComponent {...this.props} />
        </div>
      )
    }
  }

  // pour le debug, cf https://reactjs.org/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging
  AddLabel.displayName = `addLabel(${getDisplayName(WrappedComponent)})`

  AddLabel.propTypes = {
    className: PropTypes.string,
    info: PropTypes.string,
    label: PropTypes.node,
    name: PropTypes.string
  }

  return AddLabel
}

export default addLabel
