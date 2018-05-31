import React from 'react'

const ShowError = ({error}) => {
  if (!error) return null

  return (
    <div className="error">
      {error.message}
    </div>
  )
}

export default ShowError
