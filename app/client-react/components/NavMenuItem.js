import React from 'react'
import PropTypes from 'prop-types'
import {NavLink} from 'react-router-dom'

const NavMenuItem = ({
  id,
  to,
  icon,
  target,
  title
}) => (
  <li id={id}>
    <NavLink
      to={to}
      title={title}
      activeClassName="selected"
      target={target}
      className="btn"
    >
      <i className={`fa fa-${icon}`}></i> <span className="gt-medium-only">{title}</span>
    </NavLink>
  </li>
)

NavMenuItem.propTypes = {
  id: PropTypes.string,
  to: PropTypes.string,
  icon: PropTypes.string,
  target: PropTypes.string,
  title: PropTypes.string
}

export default NavMenuItem
