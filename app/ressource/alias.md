Gestion des Alias
=================

Un alias est une ressource référencée sur une sésathèque mais enregistrée sur une autre, ou la même.

Le besoin initial est de pouvoir mettre dans ses ressources perso des ressources non modifiables (dans sesalab, glisser une ressource fournie dans "mes ressources", pour éventuellement en changer le titre ou simplement l'avoir sous la main, façon marque page), mais aussi d'avoir un lien dynamique avec la source (l'alias de "mes ressources" change avec l'original)

C'est nécessaire aussi pour référencer sur une sésathèque des ressources d'une autre sésathèque (et les trouver dans des résultats de recherche par ex)

Les alias étaient stockés comme entitées séparées, mais ça complique finalement plus qu'autre chose.

Donc un alias devient une ressource
- avec une propriété aliasOf contenant le rid de la source
- qui n'est pas modifiable (sauf pour répliquer la source)
- qui est effaçable par le proprio

Une ressource sera considérée comme alias si elle a une propriété aliasOf, dans ce cas, le display sera lancé sur la sésathèque d'origine.


