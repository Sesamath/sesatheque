import * as am from './am/icon'
import * as arbre from './arbre/icon'
import * as ato from './ato/icon'
import * as collDoc from './coll_doc/icon'
import * as ecjs from './ecjs/icon'
import * as em from './em/icon'
import * as iep from './iep/icon'
import * as j3p from './j3p/icon'
import * as mathgraph from './mathgraph/icon'
import * as mental from './mental/icon'
import * as sequenceModele from './sequenceModele/icon'
import * as serie from './serie/icon'
import * as url from './url/icon'

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
  mental,
  sequenceModele,
  serie,
  url
]

plugins.forEach(({
  type,
  icon
}) => {
  icons[type] = icon
})

export default icons
