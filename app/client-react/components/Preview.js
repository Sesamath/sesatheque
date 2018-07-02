import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import NavMenu from './NavMenu'
import resourceLoader from '../hoc/resourceLoader'

const Preview = ({
  ressource: {oid: ressourceOid, titre}
}) => (
  <Fragment>
    <NavMenu
      ressourceOid={ressourceOid}
      titre={`Aperçu de la ressource ${titre}`}
    />
    <iframe src={`/ressource/voir/${ressourceOid}`} />
  </Fragment>
)

Preview.propTypes = {
  ressource: PropTypes.shape({
    oid: PropTypes.string,
    titre: PropTypes.string
  })
}

export default resourceLoader(Preview)
