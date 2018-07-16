import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import ensureLogged from '../hoc/ensureLogged'

/**
 * Affiche les informations concernants le compte de l'utilisateur.
 */
const Account = ({personne, sso}) => (
  <Fragment>
    <h1>Mes informations personnelles</h1><br />
    <p>
      Voici les informations vous concernant qui sont stockées dans cette sésathèque.
    </p>
    <div className="grid-6 has-gutter">
      <div className="txtright"><strong>Identifiant :</strong></div>
      <div className="col-5">{personne.pid}</div>

      <div className="txtright"><strong>Nom et prénom :</strong></div>
      <div className="col-5">{personne.nom} {personne.prenom}</div>
    </div><br />
    <p>
      Ces informations proviennent de {sso.name} <a href={sso.links && sso.links[1].href} target="_blank" rel="noopener noreferrer">modifier ces informations</a>
    </p>
  </Fragment>
)

Account.propTypes = {
  personne: PropTypes.object,
  sso: PropTypes.array
}

const mapStateToProps = ({
  session
}) => ({
  personne: session && session.personne,
  sso: session && session.ssoLinks
})

export default ensureLogged(connect(mapStateToProps)(Account))
