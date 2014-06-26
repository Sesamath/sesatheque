'use strict';

/**
 * Nos listes de types & co, qui changent rarement
 */
module.exports = {
  niveaux          : {
    11: 'CP',
    10: 'CE1',
    9 : 'CE2',
    8 : 'CM1',
    7 : 'CM2',
    6 : 'sixième',
    5 : 'cinquième',
    4 : 'quatrième',
    3 : 'troisième',
    2 : 'seconde',
    1 : 'première',
    T : 'terminale'
  },
  categories       : {
    1: "Activité fixe",
    2: "Activité animée",
    3: "Cours fixe",
    4: "Cours avec animation",
    5: "Exercice fixe",
    6: "Exercice avec animation",
    7: "Exercice interactif"
  },
  typePedagogiques : {
    // id de scolomfr-voc-010, « on s'en sert pour faire quoi ? »
    3  : "cours / présentation",
    9  : "exercice",
    91 : "corrigé d'exercice",
    92 : "énoncé d'exercice",
    191: "QCM (question à choix multiples)",
    7  : "évaluation",
    2  : "autoévaluation",
    81 : "sujet d'examen et de concours",
    82 : "préparation à l'examen",
    13 : "jeu éducatif",
    141: "manuel scolaire",
    151: "document de référence",
    21 : "simulation",
    22 : "tutoriel"
  },
  typeDocumentaires: {
    // id de scolomfr-voc-004, qui sont de la forme scolomfr-voc-004-num-NNN, on ne reprend ici que le NNN
    // http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=49
    // http://www.cndp.fr/scolomfr//fileadmin/_scolomfr/04.xml
    // pour un exercice contenant texte et image faut mettre les deux
    5 : "vidéo / animation", // nommé image en mouvement dans le voc officiel
    9 : "ressource interactive",
    6 : "image fixe", // on laisse tomber le 4 image tout court
    12: "texte",
    11: "son",
    1 : "collection", // une liste de ressources
    2 : "ensemble de données"
  },
  relations : {
    1 : "est associée à",
    4 : "est une version de",
    5 : "existe en une autre version",
    6 : "est remplacée par",
    7 : "remplace",
    8 : "est requis par",
    9 : "requiert",
    10 : "est une partie de",
    11 : "contient",
    12 : "est référencé par",
    13 : "contient une référence à",
    14 : "est un format de",
    15 : "existe dans un format",
    16 : "est la traduction de",
    17 : "fait l’objet d’une traduction",
    21 : "a pour vignette",
    51 : "a pour corrigé",
    52 : "est la correction de"
  }
};
