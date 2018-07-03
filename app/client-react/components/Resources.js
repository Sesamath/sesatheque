import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import ResourceList from './ResourceList'
import {NavLink} from 'react-router-dom'

const Resources = ({location}) => (
  <Fragment>
    <NavLink to={'/ressource/rechercher' + location.search} className="fr edit-search">
      <i className={`fa fa-edit`}></i> Modifier les filtres de recherche
    </NavLink>
    <h1>Ressources</h1>
    <ResourceList perPage="10" />
  </Fragment>
)

Resources.propTypes = {
  location: PropTypes.object
}

export default Resources
