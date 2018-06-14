import PropTypes from 'prop-types'
import React from 'react'

const GroupPublicationEditor = ({name, index, disabled}) => (
  <tr>
    <td>{name}</td>
    <td>
      <input
        type="checkbox"
        name={`groupes[${index}]`}
        disabled={disabled}
      />
    </td>
    <td>
      <input
        type="checkbox"
        name={`groupesAuteurs[${index}]`}
        disabled={disabled}
      />
    </td>
  </tr>
)

GroupPublicationEditor.propTypes = {
  name: PropTypes.string,
  index: PropTypes.number,
  disabled: PropTypes.bool
}

export default GroupPublicationEditor
