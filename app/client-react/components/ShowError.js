import PropTypes from 'prop-types'
import React from 'react'

const ShowError = ({error}) => {
  if (!error) return null

  return (
    <div className="error">
      {error.message}
    </div>
  )
}

ShowError.propTypes = {
  error: PropTypes.object
}

export default ShowError
