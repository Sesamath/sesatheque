import PropTypes from 'prop-types'
import React from 'react'
import {Link} from 'react-router-dom'
import {getContext} from 'recompose'
import {version} from '../../../package'
import './Footer.scss'

export const Footer = ({isIframeLayout}) => {
  if (isIframeLayout) return null

  return (
    <footer>
      <ul role="navigation" className="clearfix unstyled">
        <li className="fl">
          <Link to="/mentionsLegales">Infos légales</Link>
        </li>
        <li className="fl">
          <a href="http://www.sesamath.net">Association Sésamath</a>
        </li>
        <li className="fr">
          Propulsé par <a href="https://framagit.org/Sesamath/sesatheque">Sésathèque</a> {version}
        </li>
      </ul>
    </footer>
  )
}

Footer.propTypes = {
  isIframeLayout: PropTypes.bool
}

export default getContext({isIframeLayout: PropTypes.bool})(Footer)
