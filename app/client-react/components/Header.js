import queryString from 'query-string'
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {NavLink} from 'react-router-dom'
import {connect} from 'react-redux'
import {version} from '../../../package'

const logoUrl = `/images/sesatheque.png?${version}`

const setRedirect = (str) => {
  // redirect to first loaded page
  // should be improved to use current page
  const url = new URL(str)
  const parsedQuery = queryString.parse(url.search)
  parsedQuery.redirect = document.location.href
  const urlApplication = new URL(parsedQuery.url_application)
  urlApplication.search = queryString.stringify({
    redirect: document.location.href
  })
  parsedQuery.url_application = urlApplication.href
  url.search = queryString.stringify(parsedQuery)

  return url.href
}

const getButtons = (user) => {
  const buttonSearch = {
    id: 'buttonSearch',
    title: 'Recherche',
    to: '/ressource/rechercher',
    icon: 'search',
    target: '_self'
  }
  if (user === null) {
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
      to: `/ressource/rechercher?auteurs=${user.pid}`,
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
  user,
  loginLink,
  logoutUrl,
  ssoLinks
}) => (
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
      {getButtons(user).map(({
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
        {user === null ? (
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
              <div>{`${user.prenom} ${user.nom} (${user.pid})`}</div>
              {ssoLinks ? ssoLinks.map(({
                href,
                icon,
                value
              }) => (
                <li key={href}>
                  <a href={href} title={value}>
                    <i className={`fa fa-${icon}`}></i>
                    <span>{value}</span>
                  </a>
                </li>
              )) : null}
              <li>
                <a href={logoutUrl} title="Déconnexion">
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

Header.propTypes = {
  user: PropTypes.object,
  logoutUrl: PropTypes.string,
  loginLink: PropTypes.object,
  ssoLinks: PropTypes.arrayOf(PropTypes.object)
}

const mapStateToProps = ({personne}) => ({
  user: personne && personne.user,
  logoutUrl: personne && personne.logoutUrl,
  // we suppose that loginLinks is a singleton
  // todo: add support for several links
  loginLink: personne && personne.loginLinks && personne.loginLinks[0],
  ssoLinks: personne && personne.ssoLinks
})

export default connect(mapStateToProps, {})(Header)
