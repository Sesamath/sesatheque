import React from 'react'
import PropTypes from 'prop-types'

const NavButton = ({icon, id, onClick, title}) => (
  <li><button id={id} onClick={onClick}><i className={`fa fa-${icon}`}></i> <span className="gt-medium-only">{title}</span></button></li>
)

NavButton.propTypes = {
  onClick: PropTypes.func,
  id: PropTypes.string,
  icon: PropTypes.string,
  title: PropTypes.string
}

export default NavButton
