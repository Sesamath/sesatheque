import React from 'react'
import {Link} from 'react-router-dom'
import {version} from '../../../package'

const Footer = () => (
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

export default Footer
