import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'
import {version} from '../../../package'

const Footer = ({iframe}) => {
  if (iframe) return null

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
  iframe: PropTypes.bool
}

const mapStateToProps = ({iframe}) => ({
  iframe
})

export default connect(mapStateToProps, {})(Footer)
