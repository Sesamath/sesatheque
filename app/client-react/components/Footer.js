import React from 'react'
import {version} from '../../../package'

const Footer = () => (
  <footer>
    <ul role="navigation" className="clearfix unstyled">
      <li className="fl">
        <a
          href="#"
          onClick={() => alert('Cette page reste à rédiger')}>Infos légales</a>
      </li>
      <li className="fl">
        <a href="http://www.sesamath.net">Association Sésamath</a>
      </li>
      <li className="fr">
        Propulsé par <a href="#" onClick={() => alert('Le site http://sesatheque.sesamath.net va venir')}>Sésathèque</a> {version}
      </li>
    </ul>
  </footer>
)

export default Footer
