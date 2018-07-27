import * as am from './am'
import * as arbre from './arbre'
import * as ato from './ato'
import * as collDoc from './coll_doc'
import * as ecjs from './ecjs'
import * as em from './em'
import * as iep from './iep'
import * as j3p from './j3p'
import * as mathgraph from './mathgraph'
import * as url from './url'

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

export {displays, icons, editors}
