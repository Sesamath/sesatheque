import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import ReactPaginate from 'react-paginate'
import {NavLink} from 'react-router-dom'
import queryString from 'query-string'
import './ResourceList.scss'
import {icons} from 'plugins'

export const ResourceList = ({
  handlePageClick,
  queryOptions,
  resources,
  total
}) => {
  // query et queryOptions vont toujours ensemble
  if (!queryOptions) {
    // pas très normal…
    console.error(Error('ResourceList appelé sans query'))
    return (
      <p>Aucun critère de recherche (<a href="#form">rechercher</a>).</p>
    )
  }
  if (!total) {
    return (
      <p>Aucune ressource ne correspond à vos critères de recherche (<a href="#form">modifier</a>).</p>
    )
  }
  const {skip, limit} = queryOptions
  const last = Math.min(skip + limit, total)
  const hasPages = skip > 0 || last < total
  const pagination = hasPages ? (
    <ReactPaginate
      previousLabel={'<'}
      nextLabel={'>'}
      breakLabel={<a href="">...</a>}
      pageCount={Math.ceil(total / limit)}
      onPageChange={handlePageClick}
      containerClassName={'pagination'}
      activeClassName={'active'} />
  ) : null
  const subNav = (
    <Fragment>
      <p className="fl">Ressources de {skip + 1} à {last} sur {total}</p>
      {pagination}
    </Fragment>
  )

  return (
    <Fragment>
      {subNav}
      <table className="table resourceList">
        <thead>
          <tr>
            <th></th>
            <th>Type</th>
            <th>Identifiant</th>
            <th>Titre</th>
            <th colSpan="4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map(({
            oid,
            titre,
            type,
            $droits
          }) => (
            <tr key={oid}>
              <td><img src={icons[type]} alt="thumbnail" /></td>
              <td>{type}</td>
              <td>{oid}</td>
              <td>{titre}</td>
              <td colSpan="4" className="links">
                <NavLink
                  to={`/ressource/decrire/${oid}`}
                  title="Description"
                >Description</NavLink>
                <NavLink
                  to={`/ressource/apercevoir/${oid}`}
                  title="Aperçu"
                >Aperçu</NavLink>
                <NavLink
                  to={`/ressource/voir/${oid}`}
                  title="Voir"
                  target="_blank"
                >Voir</NavLink>
                {$droits.includes('W') ? (
                  <NavLink
                    to={`/ressource/modifier/${oid}`}
                    title="Modifier"
                  >Modifier</NavLink>
                ) : null}
                {$droits.includes('D') ? (
                  <NavLink
                    to={`/ressource/supprimer/${oid}`}
                    title="Supprimer"
                  >Supprimer</NavLink>
                ) : null}
              </td>
            </tr>
          ))}
          {!resources.length ? (
            <tr>
              <td colSpan="7" className="empty">-</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {subNav}
    </Fragment>
  )
}

ResourceList.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.shape({
    oid: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    titre: PropTypes.string.isRequired,
    $droits: PropTypes.string.isRequired,
    resume: PropTypes.string,
    description: PropTypes.string,
    commentaires: PropTypes.string
  })).isRequired,
  total: PropTypes.number.isRequired,
  handlePageClick: PropTypes.func.isRequired,
  // fourni par resourceListProvider
  query: PropTypes.object,
  queryOptions: PropTypes.shape({
    skip: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired
  })
}

// pour ajouter le comportement du changement de page
const mapDispatchToProps = (dispatch, {query, queryOptions}) => ({
  // au clic sur un changement de pagination faut mettre à jour l'url
  // (et resourceListProvider mettra à jour la liste resources)
  handlePageClick: (data) => {
    const params = {
      ...query,
      skip: (Math.round(data.selected) || 0) * queryOptions.limit
    }

    dispatch(push({
      pathname: '/ressource/rechercher',
      search: queryString.stringify(params)
    }))
  }
})

export default connect(null, mapDispatchToProps)(ResourceList)
