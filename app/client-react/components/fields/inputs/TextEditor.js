import PropTypes from 'prop-types'
import React from 'react'
import AceEditor from 'react-ace'
import 'brace'
import 'brace/mode/json'
import 'brace/mode/xml'
import 'brace/theme/github'
import 'brace/ext/searchbox'
import showInvalidField from '../hoc/showInvalidField'

import './TextEditor.scss'

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

const TextEditor = ({ input: { value, onChange, onBlur, onFocus }, onValidate, mode }) => (
  <AceEditor
    mode={mode}
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
    value={mode === 'json' ? formatJSON(value) : value}
    editorProps={{
      $blockScrolling: true
    }}
  />
)

TextEditor.propTypes = {
  input: PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func
  }),
  mode: PropTypes.string,
  onValidate: PropTypes.func
}

export default showInvalidField(TextEditor)
