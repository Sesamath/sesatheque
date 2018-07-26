import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'

const EditorCollDoc = ({
  idOrigin
}) => {
  const url = `https://ressources.sesamath.net/coll/docs_consulter.php?ledoc=${idOrigin}`

  return (
    <p>
      Cette ressource ne peut pas être éditée ici, vous devez le faire via <a href={url}>{url}</a>.
    </p>
  )
}

EditorCollDoc.propTypes = {
  idOrigin: PropTypes.string
}

const mapStateToProps = ({ressource: {idOrigin}}) => ({idOrigin})

export default connect(mapStateToProps)(EditorCollDoc)
