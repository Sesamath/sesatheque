Gestion des vues
================

Lors de l'appel de `context.html(data)`, lassi fonctionne ainsi
* affecte la racine de vues avec data.$views
* passera à {data.$views}/{data.$layout}.dust les variables suivantes
** head : le rendu de data.$metas
** propX : le rendu de data.propX, pour toutes les propriétés de data non préfixés par $

Pour le rendu de data.propX, 
* si data.propX.$view existe et commence par un /, lassi utilisera le template /{data.propX.$view}.dust
* s'il existe et ne commence pas par un / ce sera {data.$views}/{data.propX.$view}.dust
* sinon, {data.$views}/{propX}.dust

Pour les partials (notation {>varX /} ou {>"monPartial" /}), lassi les remplace par le rendu de 
{data.$views}/partials/{varX}.dust

Attention, le partial récupère tout le contexte courant, pour lui passer un contexte différent on peut utiliser
{#tableauX}{>varX /}{/tableauX}, le context de la vue {varX} sera alors chaque item de {tableauX} (si tableauX est un objet 
chacune de ses propriété devient une variable dans le partial), mais il y a de l'héritage, si varX utilise {foo} et que la 
variable foo n'existe pas dans l'item mais existe dans la page parente, c'est la valeur du parent qui sera utilisée.

Pour supprimer l'héritage, on peut utiliser {#tableauX:varQuiNexistePas}{>varX /}{/tableauX}

Dans Sésathèque, on utilise ces propriétés pour data, toutes sont optionnelles
* error : une string, donc directement rendue par le layout
* errors : un objet avec un tableau errorMessages (vue errors)
* warnings : tableau de string (les message de warnings), vue warnings
* flashBloc : contient un tableau messages, vue flash
* contentBloc, qui a une $view désignant un dust à la racine de views
* blocs, qui contient un tableau d'objets de la forme {partial:"nom de la vue dans partials", data}
* jsBloc, avec un tableau jsFiles et une string jsCode, vue js
