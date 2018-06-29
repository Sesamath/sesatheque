import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import NavMenu from './NavMenu'
import resourceLoader from '../hoc/resourceLoader'

const Preview = ({
  iframe,
  ressource: {oid: ressourceOid, titre}
}) => (
  <Fragment>
    <h1 className={iframe ? '' : 'fl'}>Aperçu de la ressource {titre}</h1>
    {iframe ? null : (
      <NavMenu ressourceOid={ressourceOid} />
    )}
    <iframe src={`/ressource/voir/${ressourceOid}`} />
  </Fragment>
)

Preview.propTypes = {
  ressource: PropTypes.shape({
    oid: PropTypes.string,
    titre: PropTypes.string
  }),
  iframe: PropTypes.bool
}

const mapStateToProps = ({iframe}) => ({iframe})

export default connect(mapStateToProps, {})(resourceLoader(Preview))
