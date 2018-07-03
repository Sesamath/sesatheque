import PropTypes from 'prop-types'
import React, {Fragment} from 'react'
import NavMenu from './NavMenu'
import resourceLoader from '../hoc/resourceLoader'

const Preview = ({
  ressource: {
    _droits: droits,
    oid: ressourceOid,
    titre
  }
}) => (
  <Fragment>
    <NavMenu
      droits={droits}
      ressourceOid={ressourceOid}
      titre={`Aperçu de la ressource ${titre}`}
    />
    <iframe src={`/ressource/voir/${ressourceOid}`} />
  </Fragment>
)

Preview.propTypes = {
  ressource: PropTypes.shape({
    _droits: PropTypes.string,
    oid: PropTypes.string,
    titre: PropTypes.string
  })
}

export default resourceLoader(Preview)
