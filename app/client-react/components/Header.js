import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {NavLink} from 'react-router-dom'
import {connect} from 'react-redux'

const getButtons = (personne) => {
  const buttonSearch = {
    id: 'buttonSearch',
    title: 'Recherche',
    to: '/ressource/rechercher',
    icon: 'search',
    target: '_self'
  }
  if (personne === null) {
    return [buttonSearch]
  }

  return [
    {
      id: 'buttonAdd',
      title: 'Ajouter une ressource',
      to: '/ressource/ajouter',
      icon: 'plus-circle',
      target: '_self'
    },
    buttonSearch,
    {
      id: 'buttonMyRessources',
      title: 'Mes ressources',
      to: `/ressource/rechercher?auteurs=${personne.pid}`,
      icon: 'bookmark',
      target: '_self'
    },
    {
      id: 'buttonMyGroupes',
      title: 'Mes groupes',
      to: '/groupe/perso',
      icon: 'users',
      target: '_self'
    }
  ]
}

const Header = ({
  personne
}) => (
  <header id="header" role="banner">
    <NavLink
      to="/"
      target="_self"
    >
      <img src="/images/sesatheque.png?1.1.31" width="250" height="48" alt="logo" />
    </NavLink>
    <nav
      className="navigation fr"
      role="navigation"
    >
      {getButtons(personne).map(({
        icon,
        title,
        to,
        target
      }) => (
        <NavLink
          key={to}
          to={to}
          title={title}
          target={target}
        >
          <i className={`fa fa-${icon}`}></i>
          <span>{title}</span>
        </NavLink>
      ))}
      <div id="auth">
        {personne === null ? (
          <a href="https://ssl.devsesamath.net/sesamath/pages/identification.php?statut_requis=Authentifie&amp;motif=identification_requise&amp;url_application=http%3A%2F%2Flocalhost%3A3001%2Fsesasso%2Fvalidate%3Fredirect%3Dhttp%253A%252F%252Flocalhost%253A3001%252F&amp;url_deconnexion=http%3A%2F%2Flocalhost%3A3001%2Fsesasso%2Fapi%2Flogout&amp;redirect=%2F" title="Connexion">

            <i className="fa fa-sign-in-alt"></i>
            <span>Connexion</span>

          </a>
        ) : (
          <Fragment>
            <a href="#">
              <i className="fa fa-user"></i>
              <i className="fa fa-ellipsis-v"></i>
            </a>
            <ul>
              <div>{`${personne.prenom} ${personne.nom} (${personne.pid})`}</div>
              <li>
                <a href="http://sesaprof.devsesamath.net/pages/prof_gestion_accueil.php" title=" Mon espace Sésamath">
                  <i className="fa fa-home"></i> <span> Mon espace Sésamath</span>
                </a>
              </li>
              <li>
                <a href="https://ssl.devsesamath.net/sesamath/pages/prof_gestion_donnees_personnelles.php" title="Informations personnelles">

                  <i className="fa fa-user-secret"></i>
                  <span>Informations personnelles</span>

                </a>
              </li>
              <li>
                <a href="https://ssl.devsesamath.net/sesamath/pages/identification_deconnexion.php" title="Déconnexion">
                  <i className="fa fa-sign-out-alt"></i>
                  <span>Déconnexion</span>
                </a>
              </li>
            </ul>
          </Fragment>
        )}
      </div>
    </nav>
  </header>
)

const mapStateToProps = ({personne}) => ({personne})

export default connect(mapStateToProps, null)(Header)
