import PropTypes from 'prop-types'
import React from 'react'
import AceEditor from 'react-ace'
import 'brace'
import 'brace/mode/json'
import 'brace/theme/github'
import 'brace/ext/searchbox'
import showInvalidField from '../hoc/showInvalidField'

import './JsonEditor.scss'

/**
 * Formate un objet en string json (pretty)
 * @param {object|string} value Un objet (si string elle sera retournée telle quelle)
 * @return {string} La chaîne de caractères formattée en "pretty" json ({} si value n'était pas un objet stringifiable)
 */
function formatJSON (value) {
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    console.error(error)
    return '{}'
  }
}

const JsonEditor = ({ input: { value, onChange, onBlur, onFocus }, onValidate }) => (
  <AceEditor
    mode="json"
    theme="github"
    fontSize={14}
    onChange={onChange}
    onFocus={onFocus}
    onBlur={(_, editor) => onBlur(editor.getValue())}
    onValidate={onValidate}
    width="100%"
    highlightActiveLine={true}
    showPrintMargin={false}
    wrapEnabled
    maxLines={Infinity}
    tabSize={2}
    value={formatJSON(value)}
    editorProps={{
      $blockScrolling: true
    }}
  />
)

JsonEditor.propTypes = {
  input: PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func
  }),
  onValidate: PropTypes.func
}

export default showInvalidField(JsonEditor)
