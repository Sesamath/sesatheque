import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import ensureLogged from '../hoc/ensureLogged'

/**
 * Affiche les informations concernants le compte de l'utilisateur.
 */
const Account = ({personne, sso}) => {
  // le lien vers les données perso est le premier (on le vire dans le header pour ne le garder qu'ici)
  const firstHref = sso && sso.links && sso.links[0] && sso.links[0].href

  return (
    <Fragment>
      <h1>Mes informations personnelles</h1>
      <p>Voici les informations vous concernant qui sont stockées dans cette sésathèque.</p>
      <div className="grid-6 has-gutter">
        <div className="txtright"><strong>Identifiant :</strong></div>
        <div className="col-5">{personne.pid} <em>(vous pouvez le transmettre à un collègue pour qu’il vous ajoute à un groupe ou bien comme co-auteur d’une de ses ressource)</em></div>

        <div className="txtright"><strong>Prénom :</strong></div>
        <div className="col-5">{personne.prenom}</div>

        <div className="txtright"><strong>Nom :</strong></div>
        <div className="col-5">{personne.nom}</div>
      </div><br />
      {sso && sso.name
        ? firstHref
          ? (
            <p>
              Ces informations proviennent du serveur d’authentification « {sso.name} » <a href={firstHref} target="_blank" rel="noopener noreferrer">modifier ces informations</a>
            </p>
          ) : (
            <p>
              Ces informations proviennent du serveur d’authentification « {sso.name} » mais il n’a pas fourni de lien pour les modifier.
            </p>
          )
        : (
          <p>Erreur interne, données du serveur d’authentification manquantes.</p>
        )
      }
    </Fragment>
  )
}

Account.propTypes = {
  personne: PropTypes.object,
  sso: PropTypes.shape({
    links: PropTypes.arrayOf(PropTypes.object),
    name: PropTypes.string
  })
}

const mapStateToProps = ({
  session
}) => ({
  personne: session && session.personne,
  sso: session && session.sso
})

export default ensureLogged(
  connect(mapStateToProps)(Account)
)
