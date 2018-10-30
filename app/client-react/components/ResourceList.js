import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import ReactPaginate from 'react-paginate'
import {NavLink} from 'react-router-dom'
import {getContext} from 'recompose'
import icons from 'plugins/icons'
import {askDelete} from '../utils/ressourceOperations'

import './ResourceList.scss'

const ResourceList = ({
  isIframeLayout,
  handlePageClick,
  askDelete,
  refreshList,
  queryOptions,
  resources,
  showSearchLink,
  subNavText,
  total
}) => {
  // query et queryOptions vont toujours ensemble
  if (!queryOptions) {
    // pas très normal…
    console.error(Error('ResourceList appelé sans query'))
    return (
      <p className="alert--info">Aucun critère de recherche. {showSearchLink ? (<a href="#form">(rechercher)</a>) : ''}.</p>
    )
  }
  if (!total) {
    return (
      <p className="alert--info">Aucune ressource ne correspond à vos critères de recherche. {showSearchLink ? (<a href="#form">(modifier)</a>) : ''}</p>
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
      forcePage={Math.ceil(skip / limit)}
      pageCount={Math.ceil(total / limit)}
      onPageChange={handlePageClick}
      containerClassName={'pagination'}
      activeClassName={'active'} />
  ) : null
  const subNav = subNavText ? (<Fragment>{subNavText}</Fragment>) : (
    <Fragment>
      <p className="fl">Ressources de {skip + 1} à {last} sur {total}</p>
      {pagination}
    </Fragment>
  )

  return (
    <div className="search-results">
      {subNav}
      <table className="table resourceList">
        <thead>
          <tr>
            <th>Type</th>
            <th>Identifiant</th>
            <th>Titre</th>
            <th colSpan="4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map(({
            oid,
            rid,
            titre,
            type,
            $droits
          }, index) => {
            // on peut avoir des items de type error avec seulement un titre
            if (type === 'error') {
              return (
                <tr key={index}>
                  <td className="type"><img src={icons[type]} alt="" title={type} /></td>
                  <td></td>
                  <td>{titre}</td>
                  <td colSpan="4" className="links"></td>
                </tr>
              )
            }
            return (
              <tr key={oid}>
                <td className="type"><img src={icons[type]} alt="" title={type} /></td>
                <td>{oid}</td>
                <td>{titre}</td>
                <td colSpan="4" className="links">
                  <NavLink
                    to={`/ressource/decrire/${oid}`}
                    title="Description">
                    <span>Description</span>
                    <i className="fa fa-file-alt"></i>
                  </NavLink>
                  <NavLink
                    to={`/ressource/apercevoir/${oid}`}
                    title="Aperçu">
                    <span>Aperçu</span>
                    <i className="fa fa-eye"></i>
                  </NavLink>
                  <NavLink
                    to={`/ressource/voir/${oid}`}
                    title="Voir"
                    target="_blank"
                    className="ignore--blank">
                    <span>Voir</span>
                    <i className="fa fa-external-link-alt"></i>
                  </NavLink>
                  {$droits.includes('W') ? (
                    <NavLink
                      to={`/ressource/modifier/${oid}`}
                      title="Modifier">
                      <span>Modifier</span>
                      <i className="fa fa-edit"></i>
                    </NavLink>
                  ) : null}
                  {$droits.includes('D') ? (
                    <a
                      onClick={(e) => {
                        e.preventDefault()
                        askDelete(oid, refreshList)
                      }}
                      href="#"
                      title="Supprimer">
                      <span>Supprimer</span>
                      <i className="fa fa-trash"></i>
                    </a>
                  ) : null}
                  {isIframeLayout ? (
                    <a
                      onClick={(e) => {
                        e.preventDefault()
                        window.parent.postMessage({
                          action: 'ressource-copy',
                          rid
                        }, '*')
                      }}
                      href="#"
                      title="Copier">
                      <span>Copier</span>
                      <i className="fa fa-share"></i>
                    </a>
                  ) : null}
                </td>
              </tr>
            )
          })}
          {!resources.length ? (
            <tr>
              <td colSpan="7" className="empty">-</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {subNav}
    </div>
  )
}

ResourceList.propTypes = {
  isIframeLayout: PropTypes.bool,
  resources: PropTypes.arrayOf(PropTypes.shape({
    oid: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    titre: PropTypes.string.isRequired,
    $droits: PropTypes.string.isRequired,
    resume: PropTypes.string,
    description: PropTypes.string,
    commentaires: PropTypes.string
  })).isRequired,
  showSearchLink: PropTypes.bool,
  total: PropTypes.number.isRequired,
  handlePageClick: PropTypes.func.isRequired,
  askDelete: PropTypes.func.isRequired,
  // fourni par resourceListProvider
  query: PropTypes.object,
  queryOptions: PropTypes.shape({
    skip: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired
  }),
  refreshList: PropTypes.func.isRequired,
  subNavText: PropTypes.string
}

const mapDispatchToProps = (dispatch, {refreshList}) => ({
  askDelete: askDelete(dispatch, refreshList)
})

export default getContext({isIframeLayout: PropTypes.bool})(connect(null, mapDispatchToProps)(ResourceList))
