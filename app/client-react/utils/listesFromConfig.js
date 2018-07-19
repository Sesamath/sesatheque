import {editable, listes, listesOrdonnees} from '../../server/ressource/config'

/**
 * Les listes sous forme de tableaux ordonnés avec label & value
 * On ajoute une liste editableTypes (types filtrés)
 * @type {{[listName]: string, ListeItem[]}}
 */
const formattedLists = {}

Object.entries(listes).forEach(([key, values]) => {
  if (listesOrdonnees.hasOwnProperty(key)) {
    formattedLists[key] = listesOrdonnees[key].map(n => ({
      label: values[n],
      value: n
    }))
  } else {
    formattedLists[key] = Object.entries(values).map(([value, label]) => ({
      value,
      label
    }))
  }
})

formattedLists.editableTypes = formattedLists.type.filter(({value, label}) => editable[value])

export default formattedLists
