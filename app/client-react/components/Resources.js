import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import ResourceList from './ResourceList'
import {NavLink} from 'react-router-dom'

const perPage = '25'

const Resources = ({search}) => (
  <Fragment>
    <NavLink
      to={{
        pathname: '/ressource/rechercher',
        search
      }}
      className="fr edit-search"
    >
      <i className={`fa fa-edit`}></i> Modifier les filtres de recherche
    </NavLink>
    <h1>Résultat de la recherche</h1>
    <ResourceList perPage={perPage} />
  </Fragment>
)

Resources.propTypes = {
  search: PropTypes.string
}

const mapStateToProps = ({router: {location: {search}}}) => ({search})

export default connect(mapStateToProps, {})(Resources)
