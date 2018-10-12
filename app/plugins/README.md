# Plugins

## arborescence
Chaque plugin a un type qui lui est propre et qui est une chaine de caractères. Par exemple: 'j3p', 'arbre'.

Chaque plugin doit exposer:
* icon qui exporte un objet {type, icon}
* display qui exporte un objet {type, ...displayOThers}
* editor qui exporte un objet {type, ...editorOthers}

L'objet displayOthers peut contenir les propriétés optionnelles:
* display: void function(ressource, options, next) qui permet d'afficher la ressource en lecture

L'objet editorOthers peut contenir les propriétés optionnelles:
* editor: composant react permettant l'édition des paramètres de la ressource
* validate: void function(ressource)
* defaultValue: objet des valeurs par défaut de la ressource
* loadHook: ressource function(ressource) transformation de la ressource au chargement
* saveHook: ressource function(ressource) transformation de la ressource à la sauvegarde

Le composant react permettant l'édition de la ressource peut accéder au code du client react avec l'alias: 'client-react'. Par exemple:

import {InputField} from 'client-react/components/fields'

ou 
