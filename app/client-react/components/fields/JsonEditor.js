import PropTypes from 'prop-types'
import React from 'react'
import AceEditor from 'react-ace'
import 'brace'
import 'brace/mode/json'
import 'brace/theme/github'
import 'brace/ext/searchbox'

import './JsonEditor.scss'

const JsonEditor = ({ input: { value, onChange, onBlur, onFocus } }) => (
  <AceEditor
    mode="json"
    theme="github"
    fontSize={14}
    onChange={onChange}
    onFocus={onFocus}
    onBlur={(_, editor) => onBlur(editor.getValue())}
    width="100%"
    highlightActiveLine={true}
    showPrintMargin={false}
    wrapEnabled
    maxLines={Infinity}
    tabSize={2}
    value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
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
  })
}

export default JsonEditor
