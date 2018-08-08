import * as am from './am/editor'
import * as arbre from './arbre/editor'
import * as ato from './ato/editor'
import * as collDoc from './coll_doc/editor'
import * as ecjs from './ecjs/editor'
import * as em from './em/editor'
import * as iep from './iep/editor'
import * as j3p from './j3p/editor'
import * as mathgraph from './mathgraph/editor'
import * as url from './url/editor'

const editors = {}

const plugins = [
  am,
  arbre,
  ato,
  collDoc,
  ecjs,
  em,
  iep,
  j3p,
  mathgraph,
  url
]

plugins.forEach(({
  type,
  editor,
  validate
}) => {
  editors[type] = {editor, validate}
})

export default editors
