import PropTypes from 'prop-types'
import React from 'react'
import AceEditor from 'react-ace-builds'
import 'react-ace-builds/webpack-resolver-min'
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

const TextEditor = ({ input: { value, onChange, onBlur, onFocus, name }, onValidate, mode }) => (
  <AceEditor
    name={name}
    mode={mode}
    theme="github"
    fontSize={14}
    onChange={onChange}
    onFocus={onFocus}
    onBlur={() => onBlur()}
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
  mode: PropTypes.string,
  onValidate: PropTypes.func
}

export default showInvalidField(TextEditor)
