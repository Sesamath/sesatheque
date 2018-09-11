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

  const {permissions: create} = personne

  const buttons = []

  if (create) {
    buttons.push({
      id: 'buttonAdd',
      title: 'Ajouter une ressource',
      to: '/ressource/ajouter',
      icon: 'plus-circle'
    })
  }

  // @todo vérifier les droits, les deux derniers boutons existent sur commun mais pas forcément sur bibli
  buttons.push(
    buttonSearch,
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
      to: '/groupes/perso',
      icon: 'users'
    }
  )

  return buttons
}

export const Header = ({
  isIframeLayout,
  personne,
  loginLink,
  logoutUrl,
  sso,
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

  return (
    <header>
      <NavLink to="/">
        <img src={logoUrl} width="250" height="48" alt="logo" />
      </NavLink>
      <nav
        className="navigation fr"
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
                <li className="user--name">{`${personne.prenom} ${personne.nom}`}</li>
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
                {sso && sso.links && sso.links.length > 1 && sso.links.slice(1).map(link => (
                  <li key={link.href}>
                    <a href={setRedirect(link.href)} title={link.value} target="_blank" rel="noopener noreferrer">
                      {link.icon && (<i className={`fa fa-${link.icon}`}></i>)}
                      <span>{link.value}</span>
                    </a>
                  </li>
                ))}
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
  sso: PropTypes.shape({
    links: PropTypes.arrayOf(PropTypes.object),
    name: PropTypes.string
  }),
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
  sso: session && session.sso,
  currentUrl: getCurrentUrl(location)
})

export default getContext({isIframeLayout: PropTypes.bool})(connect(mapStateToProps, {})(Header))
