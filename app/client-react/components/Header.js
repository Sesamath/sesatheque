import React, {Fragment} from 'react'
import {getContext} from 'recompose'
import PropTypes from 'prop-types'
import {NavLink} from 'react-router-dom'
import {connect} from 'react-redux'
import {version} from '../../../package'
import './Header.scss'

const logoUrl = `/images/sesatheque.png?${version}`

const getButtons = (personne) => {
  const buttonSearch = {
    id: 'buttonSearch',
    title: 'Recherche',
    to: {
      pathname: `/ressource/rechercher`,
      hash: `#form`
    },
    icon: 'search'
  }
  if (personne === null) {
    return [buttonSearch]
  }

  return [
    // @todo vérifier les droits avant de mettre ce bouton
    {
      id: 'buttonAdd',
      title: 'Ajouter une ressource',
      to: '/ressource/ajouter',
      icon: 'plus-circle'
    },
    buttonSearch,
    // @todo idem, ces deux boutons existent sur commun mais pas forcément sur bibli
    {
      id: 'buttonMyRessources',
      title: 'Mes ressources',
      to: {
        pathname: `/ressource/rechercher`,
        search: `?auteurs=${personne.pid}`,
        hash: `#results`
      },
      icon: 'bookmark'
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

export const Header = ({
  isIframeLayout,
  personne,
  loginLink,
  logoutUrl,
  ssoLinks,
  currentUrl
}) => {
  if (isIframeLayout) return null

  const setRedirect = (str) => {
    return str.replace('((s))', currentUrl)
  }

  const loginButton = loginLink ? (
    <a href={setRedirect(loginLink.href)} title="Connexion">
      <i className="fa fa-sign-in-alt"></i>
      <span>Connexion</span>
    </a>
  ) : null

  const sesamathLink = ssoLinks && ssoLinks[0]

  return (
    <header role="banner">
      <NavLink to="/">
        <img src={logoUrl} width="250" height="48" alt="logo" />
      </NavLink>
      <nav
        className="navigation fr"
        role="navigation"
      >
        {getButtons(personne).map(({
          id,
          icon,
          title,
          to,
          target
        }) => (
          <NavLink
            key={id}
            to={to}
            title={title}
            target={target}
            isActive={(match, location) => {
              if (to.hash) return location.pathname + location.hash === to.pathname + to.hash
              return location.pathname + location.hash === to
            }}
          >
            <i className={`fa fa-${icon}`}></i>
            <span>{title}</span>
          </NavLink>
        ))}
        <div className="auth">
          {personne === null ? loginButton : (
            <Fragment>
              <NavLink to="#">
                <i className="fa fa-user"></i>
                <i className="fa fa-ellipsis-v"></i>
              </NavLink>
              <ul>
                <div>{`${personne.prenom} ${personne.nom} (${personne.pid})`}</div>
                <li>
                  <NavLink
                    key="compte"
                    to="/compte"
                    title="Mes informations personnelles"
                  >
                    <i className={`fa fa-user`}></i>
                    <span>Mes informations personnelles</span>
                  </NavLink>
                </li>
                <li>
                  <a href={setRedirect(sesamathLink.href)} title={sesamathLink.value}>
                    <i className={`fa fa-${sesamathLink.icon}`}></i>
                    <span>{sesamathLink.value}</span>
                  </a>
                </li>
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
  ssoLinks: PropTypes.arrayOf(PropTypes.object),
  currentUrl: PropTypes.string
}

const getCurrentUrl = ({
  pathname,
  search,
  hash
}) => {
  const currentUrl = new URL(pathname, document.location)
  currentUrl.search = search
  currentUrl.hash = hash

  return currentUrl.href
}

const mapStateToProps = ({
  session,
  router: {location}
}) => ({
  personne: session && session.personne,
  logoutUrl: session && session.logoutUrl,
  // we suppose that loginLinks is a singleton
  // todo: add support for several links
  loginLink: session && session.loginLinks && session.loginLinks[0],
  ssoLinks: session && session.ssoLinks,
  currentUrl: getCurrentUrl(location)
})

export default getContext({isIframeLayout: PropTypes.bool})(connect(mapStateToProps, {})(Header))
