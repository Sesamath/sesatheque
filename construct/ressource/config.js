'use strict';

/**
 * Nos listes de types & co, qui changent rarement
 */
module.exports = {
  /**
   * Les listes de choix pour nos propriétés dont on enregistre des ids
   */
  listes : {
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
      12: 'terminale'
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
    restriction      : {
      0: 'aucune',
      1: 'enseignant',
      2: 'privé'
    }
  }, // fin des listes

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

  // les propriétés qui ne prennent qu'une seule valeur
  uniques          : {
    'langue'       : true,
    'restriction'  : true
  },

  // les propriétés obligatoires (oid ne l'est pas, on le vérifie spécifiquement si besoin)
  required         : {
    'titre' : true,
    'typeTechnique' : true,
    'categories' : true
    //'auteurs'
  },

  // les libellés que l'on affiche pour chaque champ de notre entité
  labels           : {
    id               : "Identifiant",
    version          : "Version",
    origine           : 'Origine',
    idOrigine         : "Identifiant d'origine",
    typeTechnique    : "Type technique",
    titre            : "Titre",
    resume           : "Résumé",
    description      : "Description",
    commentaires     : "Commentaires",
    parametres       : "Paramètres",
    niveaux          : "Niveau",
    categories       : "Catégorie",
    typePedagogiques : "Type pédagogique",
    typeDocumentaires: "Type documentaire",
    relations        : "Ressources liées",
    auteurs          : "Auteurs",
    contributeurs    : "Contributeurs",
    langue           : "Langue",
    publie           : "Publié",
    restriction      : "Restriction",
    dateCreation     : "Date de création",
    dateMiseAJour    : "Date de mise à jour"
  },

  // les propriétés dont la modif déclenche un upgrade de version
  versionTriggers : ['origine', 'idOrigine', 'parametres', 'auteurs', 'contributeurs'],

  // les types requis, Attention, le code suppose que tous les Array sont des tableaux d'entiers,
  // faudra modifier postToRessource dans edit.js si ça change
  typesVar         : {
    id               : 'Number',
    origine          : 'String',
    idOrigine        : 'String',
    typeTechnique    : 'String',
    titre            : 'String',
    resume           : 'String',
    description      : 'String',
    commentaires     : 'String',
    niveaux          : 'Array',
    categories       : 'Array',
    typePedagogiques : 'Array',
    typeDocumentaires: 'Array',
    relations        : 'Array',
    parametres       : 'Object',
    auteurs          : 'Array',
    contributeurs    : 'Array',
    langue           : 'String',
    publie           : 'Boolean',
    version          : 'Number',
    restriction      : 'Number',
    dateCreation     : 'Date',
    dateMiseAJour    : 'Date'
  },
  /**
   * Des constantes pour rendre le code plus lisible
   * (en gros un reverse sur les listes d'ids de nos propriétés)
   */
  constantes       : {
    categories       : {
      activiteFixe      : 1,
      activiteAnimee    : 2,
      coursFixe         : 3,
      coursAnime        : 4,
      exerciceFixe      : 5,
      exerciceAnime     : 6,
      exerciceInteractif: 7
    },
    typePedagogiques : {
      cours            : 3,
      exercice         : 9,
      corrigeExercice  : 91,
      enonceExercice   : 92,
      qcm              : 191,
      evaluation       : 7,
      autoEvaluation   : 2,
      sujetExam        : 81,
      prepareExam      : 82,
      jeuEduc          : 13,
      manuel           : 141,
      documentReference: 151,
      simulation       : 21,
      tutoriel         : 22
    },
    typeDocumentaires: {
      animation : 5,
      interactif: 9,
      imageFixe : 6,
      texte     : 12,
      son       : 11,
      collection: 1,
      dataSet   : 2
    },
    relations        : {
      assocA           : 1,
      estVersionDe     : 4,
      existeAussi      : 5,
      estRemplacePar   : 6,
      remplace         : 7,
      estRequisPar     : 8,
      requiert         : 9,
      estPartieDe      : 10,
      contient         : 11,
      estRefPar        : 12,
      contientRefA     : 13,
      estUnFormatDe    : 14,
      existeDansFormat : 15,
      estTraductionDe  : 16,
      estTraduitAvec   : 17,
      aPourVignette    : 21,
      aPourCorrige     : 51,
      estLaCorrectionDe: 52
    },
    restriction      : {
      aucune    : 0,
      enseignant: 1,
      prive     : 2
    },
    // des constantes pour nos routes (le nom des actions est en dur mais interne au code)
    routes : {
      display:'voir',
      preview:'apercu',
      add : 'ajouter',
      edit: 'modifier',
      describe:'decrire',
      del:'supprimer'
    }
  }, // fin constantes
  /**
   * Des formats d'affichage
   */
  formats : {
    jour : 'DD/MM/YYYY'
  },
  limites : {
    maxSql : 500
  }
};
