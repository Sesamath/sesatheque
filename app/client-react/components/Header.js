import React, {Fragment} from 'react'
import {getContext} from 'recompose'
import PropTypes from 'prop-types'
import {NavLink} from 'react-router-dom'
import {connect} from 'react-redux'
import {version} from '../../../package'

const logoUrl = `/images/sesatheque.png?${version}`

const setRedirect = (str) => {
  // @todo changer ça pour remplacer par la page courante à chaque fois qu'on en change
  // (actuellement c'est fait une seule fois au premier rendu du Header)
  return str.replace('((s))', document.location.href)
}

const getButtons = (personne) => {
  const buttonSearch = {
    id: 'buttonSearch',
    title: 'Recherche',
    to: '/ressource/rechercher',
    icon: 'search'
  }
  if (personne === null) {
    return [buttonSearch]
  }

  return [
    {
      id: 'buttonAdd',
      title: 'Ajouter une ressource',
      to: '/ressource/ajouter',
      icon: 'plus-circle'
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
  isIframeLayout,
  personne,
  loginLink,
  logoutUrl,
  ssoLinks
}) => {
  if (isIframeLayout) return null

  return (
    <header role="banner">
      <NavLink
        to="/"
      >
        <img src={logoUrl} width="250" height="48" alt="logo" />
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
        <div className="auth">
          {personne === null ? (
            loginLink ? (
              <a href={setRedirect(loginLink.href)} title="Connexion">
                <i className="fa fa-sign-in-alt"></i>
                <span>Connexion</span>
              </a>
            ) : null
          ) : (
            <Fragment>
              <NavLink
                to="#"
              >
                <i className="fa fa-user"></i>
                <i className="fa fa-ellipsis-v"></i>
              </NavLink>
              <ul>
                <div>{`${personne.prenom} ${personne.nom} (${personne.pid})`}</div>
                {ssoLinks ? ssoLinks.map(({
                  href,
                  icon,
                  value
                }) => (
                  <li key={href}>
                    <a href={setRedirect(href)} title={value}>
                      <i className={`fa fa-${icon}`}></i>
                      <span>{value}</span>
                    </a>
                  </li>
                )) : null}
                <li>
                  <a href={setRedirect(logoutUrl)} title="Déconnexion">
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
}

Header.propTypes = {
  isIframeLayout: PropTypes.bool,
  personne: PropTypes.object,
  logoutUrl: PropTypes.string,
  loginLink: PropTypes.object,
  ssoLinks: PropTypes.arrayOf(PropTypes.object)
}

const mapStateToProps = ({session, iframe, router}) => ({
  personne: session && session.personne,
  logoutUrl: session && session.logoutUrl,
  // we suppose that loginLinks is a singleton
  // todo: add support for several links
  loginLink: session && session.loginLinks && session.loginLinks[0],
  ssoLinks: session && session.ssoLinks,
  router
})

export default getContext({isIframeLayout: PropTypes.bool})(connect(mapStateToProps, {})(Header))
