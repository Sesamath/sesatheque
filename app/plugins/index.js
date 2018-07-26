import am from './am'
import arbre from './arbre'
import ato from './ato'
import collDoc from './coll_doc'
import ecjs from './ecjs'
import em from './em'
import iep from './iep'
import j3p from './j3p'
import mathgraph from './mathgraph'
import url from './url'

const editors = {}
const displays = {}
const icons = {}

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
  validate,
  icon,
  display
}) => {
  editors[type] = {editor, validate}
  displays[type] = display
  icons[type] = icon
})

export default editors
export {displays, icons}
