import PropTypes from 'prop-types'
import React from 'react'
import AceEditor from 'react-ace'
// faut importer tous les modes qu'on veut gérer (listés dans les PropTypes de ce composant)
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/mode-xml'
// le thème
import 'ace-builds/src-noconflict/theme-github'

import showInvalidField from '../hoc/showInvalidField'

import './TextEditor.scss'

/**
 * Formate un objet en string json (pretty)
 * @param {object|string} value Un objet (si string elle sera retournée telle quelle)
 * @return {string} La chaîne de caractères formattée en "pretty" json ({} si value n'était pas un objet stringifiable)
 */
function formatJSON (value) {
  if (typeof value === 'string') return value

  return JSON.stringify(value, null, 2)
}

// La modif du Field redux-form se fait sur le onChange
// cf https://github.com/manubb/react-ace-builds/blob/local/docs/Ace.md
const TextEditor = ({ input: { value, onChange, onBlur, onFocus, name }, onValidate, mode }) => (
  <AceEditor
    name={name}
    mode={mode}
    theme="github"
    fontSize={14}
    onChange={(value /*, event */) => onChange(value)}
    onValidate={onValidate}
    width="100%"
    highlightActiveLine={true}
    showPrintMargin={false}
    wrapEnabled
    maxLines={Infinity}
    tabSize={2}
    value={mode === 'json' ? formatJSON(value) : value}
  />
)

TextEditor.propTypes = {
  input: PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
      PropTypes.array
    ]),
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    name: PropTypes.string
  }),
  // attention à modifier les imports si cette liste change
  mode: PropTypes.oneOf(['json', 'xml']),
  onValidate: PropTypes.func
}

export default showInvalidField(TextEditor)
