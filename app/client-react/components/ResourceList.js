import {push} from 'connected-react-router'
import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import ReactPaginate from 'react-paginate'
import {NavLink} from 'react-router-dom'
import resourceListProvider from '../hoc/resourceListProvider'
import queryString from 'query-string'

const ResourceList = ({
  handlePageClick,
  perPage,
  resources,
  total
}) => (
  <Fragment>
    <table className="table resourceList">
      <thead>
        <tr>
          <th></th>
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
          <tr key={oid.toString()}>
            <td><img src={`/plugins/${type}/${type}.gif`} alt="thumbnail" /></td>
            <td>{oid.toString()}</td>
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
    <ReactPaginate
      previousLabel={'<'}
      nextLabel={'>'}
      breakLabel={<a href="">...</a>}
      pageCount={Math.ceil(total / perPage)}
      onPageChange={handlePageClick}
      containerClassName={'pagination'}
      activeClassName={'active'} />
  </Fragment>
)

ResourceList.propTypes = {
  resources: PropTypes.array,
  total: PropTypes.number,
  perPage: PropTypes.string,
  handlePageClick: PropTypes.func
}

const mapStateToProps = ({router: {location: {search}}}) => ({parsedSearch: queryString.parse(search)})

const mapDispatchToProps = (dispatch, {parsedSearch, perPage}) => ({
  handlePageClick: (data) => {
    const params = {
      ...parsedSearch,
      skip: Math.ceil(data.selected * perPage)
    }

    dispatch(push({
      pathname: '/ressources',
      search: queryString.stringify(params)
    }))
  }
})

// we are nesting two connects because writing:
// connect(mapStateToProps, mapDispatchToProps)
// would not provide parsedSearch in
// mapDispatchToProps ownProps parameter

export default connect(mapStateToProps, {})(
  connect(null, mapDispatchToProps)(resourceListProvider(ResourceList)
  )
)
