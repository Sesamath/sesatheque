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
  /**
   * Donne les types induits par la catégorie, mais ça peut être surchargé par l'utilisateur qui renseigne les champs
   */
  categoriesToTypes: {
    1: {
      typePedagogiques : [9],
      typeDocumentaires: [12]
    },
    2: {
      typePedagogiques : [9],
      typeDocumentaires: [5]
    },
    3: {
      typePedagogiques : [3],
      typeDocumentaires: [12]
    },
    4: {
      typePedagogiques : [3],
      typeDocumentaires: [5]
    },
    5: {
      typePedagogiques : [9],
      typeDocumentaires: [12]
    },
    6: {
      typePedagogiques : [9],
      typeDocumentaires: [5]
    },
    7: {
      typePedagogiques : [9],
      typeDocumentaires: [9]
    }
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
  relations        : {
    1 : "est associée à",
    4 : "est une version de",
    5 : "existe en une autre version",
    6 : "est remplacée par",
    7 : "remplace",
    8 : "est requis par",
    9 : "requiert",
    10: "est une partie de",
    11: "contient",
    12: "est référencé par",
    13: "contient une référence à",
    14: "est un format de",
    15: "existe dans un format",
    16: "est la traduction de",
    17: "fait l’objet d’une traduction",
    21: "a pour vignette",
    51: "a pour corrigé",
    52: "est la correction de"
  },
  langue           : {
    'deu': 'allemand',
    'eng': 'anglais',
    'ara': 'arabe',
    'eus': 'basque',
    'bre': 'breton',
    'cat': 'catalan',
    'spa': 'espagnol',
    'fra': 'français',
    'ita': 'italien',
    'por': 'portugais'
  },
  // les propriétés qui doivent être uniques
  uniques          : {
    'codeTechnique': true,
    'langue'       : true,
    'restriction'  : true
  },
  // les propriétés obligatoires (oid ne l'est pas, on le vérifie spécifiquement si besoin)
  required         : ['titre', 'codeTechnique', 'categories', 'auteurs'],
  // les libellés que l'on affiche pour chaque champ
  labels           : {
    oid              : "Identifiant",
    titre            : "Titre",
    codeTechnique    : "Code technique",
    resume           : "Résumé",
    description      : "Description",
    commentaires     : "Commentaires",
    niveaux          : "Niveau",
    categories       : "Catégorie",
    typePedagogiques : "Type pédagogique",
    typeDocumentaires: "Type documentaire",
    relations        : "Ressources liées",
    contenu          : "Options",
    auteurs          : "Auteurs",
    contributeurs    : "Contributeurs",
    langue           : "Langue",
    publie           : "Publié",
    restriction      : "Restriction",
    dateCreation     : "Date de création",
    dateMiseAJour    : "Date de mise à jour"
  },
  // les types requis seront vérifiés avec _.is{type}
  types            : {
    oid              : 'Number',
    codeTechnique    : 'String',
    titre            : 'String',
    resume           : 'String',
    description      : 'String',
    commentaires     : 'String',
    niveaux          : 'Array',
    categories       : 'Array',
    typePedagogiques : 'Array',
    typeDocumentaires: 'Array',
    relations        : 'Array',
    contenu          : 'Object',
    auteurs          : 'Array',
    contributeurs    : 'Array',
    langue           : 'String',
    publie           : 'Boolean',
    restriction      : 'Number',
    dateCreation     : 'Date',
    dateMiseAJour    : 'Date'
  }
};
