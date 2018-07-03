import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import ReactPaginate from 'react-paginate'
import {NavLink} from 'react-router-dom'
import resourceListProvider from '../hoc/resourceListProvider'
import history from '../history'
import queryString from 'query-string'

class ResourceList extends Component {
  handlePageClick (data) {
    const params = queryString.parse(history.location.search)
    params['skip'] = Math.ceil(data.selected * this.props.perPage)

    history.push({
      pathname: '/ressources',
      search: queryString.stringify(params)
    })
  }

  render () {
    return (
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
            {this.props.resources.map(({
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
                  <Fragment>
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
                  </Fragment>
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
            {!this.props.resources.length ? (
              <Fragment>
                <tr>
                  <td colSpan="7" className="empty">-</td>
                </tr>
              </Fragment>
            ) : null}
          </tbody>
        </table>
        <ReactPaginate
          previousLabel={'<'}
          nextLabel={'>'}
          breakLabel={<a href="">...</a>}
          pageCount={Math.ceil(this.props.total / this.props.perPage)}
          onPageChange={this.handlePageClick.bind(this)}
          containerClassName={'pagination'}
          activeClassName={'active'} />
      </Fragment>
    )
  }
}

ResourceList.propTypes = {
  resources: PropTypes.array,
  total: PropTypes.number,
  perPage: PropTypes.string
}

export default resourceListProvider(ResourceList)
