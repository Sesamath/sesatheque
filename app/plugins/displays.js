import * as am from './am/display'
import * as arbre from './arbre/display'
import * as ato from './ato/display'
import * as collDoc from './coll_doc/display'
import * as ecjs from './ecjs/display'
import * as em from './em/display'
import * as iep from './iep/display'
import * as j3p from './j3p/display'
import * as mathgraph from './mathgraph/display'
import * as url from './url/display'

const displays = {}

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
  display
}) => {
  displays[type] = display
})

export default displays
