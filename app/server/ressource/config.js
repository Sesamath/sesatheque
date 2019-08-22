/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'
const common = require('sesatheque-client/dist/server/config').default

/**
 * Nos listes de types & co, qui changent rarement
 */
const configRessource = {
  langueDefaut: 'fra',
  /**
   * Les listes de choix pour nos propriétés dont on enregistre des ids
   */
  listes: {
    type: {
      am: 'aide mathenpoche',
      arbre: 'arbre (liste hiérarchisée)',
      calkc: 'calculatrice cassée',
      ec2: 'exercice calculatice (flash)',
      ecjs: 'exercice calculatice (javascript)',
      em: 'exercice mathenpoche',
      j3p: 'activité j3p',
      iep: 'animation instrumenpoche',
      mathgraph: 'figure Mathgraph',
      mental: 'calcul mental',
      sequenceModele: 'modèle de séquence',
      url: 'page externe',
      qcm: 'QCM'
    },
    niveaux: common.niveaux,
    // Attention, il ne faut pas modifier les données suivantes, elles sont utilisées à de nombreux endroits dans le code
    categories: {
      1: 'Activité fixe',
      2: 'Activité animée',
      3: 'Cours fixe',
      4: 'Cours avec animation',
      5: 'Exercice fixe',
      6: 'Exercice avec animation',
      7: 'Exercice interactif',
      8: 'Liste de ressources',
      9: 'À déterminer'
    },
    typePedagogiques: {
      // id de scolomfr-voc-010, « on s'en sert pour faire quoi ? »
      3: 'cours / présentation',
      9: 'exercice',
      91: "corrigé d'exercice",
      92: "énoncé d'exercice",
      191: 'QCM (question à choix multiples)',
      7: 'évaluation',
      2: 'autoévaluation',
      81: "sujet d'examen et de concours",
      82: "préparation à l'examen",
      13: 'jeu éducatif',
      141: 'manuel scolaire',
      151: 'document de référence',
      21: 'simulation',
      22: 'tutoriel'
    },
    typeDocumentaires: {
      // id de scolomfr-voc-004, qui sont de la forme scolomfr-voc-004-num-NNN, on ne reprend ici que le NNN
      // @see http://www.lom-fr.fr/scolomfr/la-norme/manuel-technique.html?tx_scolomfr_pi1[detailElt]=49
      // http://www.cndp.fr/scolomfr//fileadmin/_scolomfr/04.xml
      // pour un exercice contenant texte et image faut mettre les deux
      5: 'vidéo / animation', // nommé image en mouvement dans le voc officiel
      9: 'ressource interactive',
      6: 'image fixe', // on laisse tomber le 4 image tout court
      12: 'texte',
      11: 'son',
      1: 'collection', // une liste de ressources
      2: 'ensemble de données'
    },
    relations: {
      1: 'est associée à',
      4: 'est une version de',
      5: 'existe en une autre version',
      6: 'est remplacée par',
      7: 'remplace',
      8: 'est requis par',
      9: 'requiert',
      10: 'est une partie de',
      11: 'contient',
      12: 'est référencé par',
      13: 'contient une référence à',
      14: 'est un format de',
      15: 'existe dans un format',
      16: 'est la traduction de',
      17: 'fait l’objet d’une traduction',
      21: 'a pour vignette',
      51: 'a pour corrigé',
      52: 'est la correction de'
    },
    langue: {
      deu: 'allemand',
      eng: 'anglais',
      ara: 'arabe',
      eus: 'basque',
      bre: 'breton',
      cat: 'catalan',
      spa: 'espagnol',
      fra: 'français',
      ita: 'italien',
      por: 'portugais'
    },
    restriction: {
      0: 'aucune',
      1: 'professeur',
      2: 'groupe(s)',
      3: 'auteur(s)'
    }
  },
  // lors de l'itération sur les listes, ça prend l'ordre numérique des noms de propriétés, on peut fixer notre ordre ici
  listesOrdonnees: {
    restriction: [0, 1, 2, 3],
    niveaux: common.ordre.niveaux,
    categories: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    typeDocumentaires: [9, 5, 6, 12, 11, 1, 2],
    typePedagogiques: [3, 9, 91, 92, 191, 7, 2, 81, 82, 13, 141, 151, 21, 22]
  }, // fin des listes
  // modifs à répercuter dans npm-sesatheque-client
  /**
   * La liste des types que l'on peut éditer dans une sésatheque (ils seront cloné en ressources à l'édition, les autres resteront des alias, ils peuvent être supprimés mais pas modifiés)
   * Utilisé par clone et createAlias pour savoir s'il faut cloner une ressource ou juste créer un alias
   */
  editable: {
    arbre: true,
    calkc: true,
    ecjs: true,
    iep: true,
    j3p: true,
    mathgraph: true,
    mental: true,
    url: true,
    qcm: true
  },
  /**
   * types qui peuvent être utilisés pour une ressource perso (form de ressource/ajouter)
   */
  typePerso: {
    ecjs: true,
    iep: true,
    j3p: true,
    mathgraph: true,
    url: true,
    qcm: true
  },

  /**
   * Les type qu'il faut toujours mettre en iframe (qui cassent les css s'ils sont embarqués dans un div d'une page)
   */
  typeIframe: {
    j3p: true
  },

  /**
   * Donne la catégorie induite par le type, mais ça peut être surchargé par l'utilisateur qui renseigne categories
   */
  typeToCategories: {
    am: [2],
    arbre: [8],
    calkc: [7],
    ec2: [7],
    ecjs: [7],
    em: [7],
    iep: [2],
    mental: [7],
    serie: [8],
    series: [8],
    sequenceModele: [8]
  },

  /**
   * Donne les types induits par la catégorie, mais ça peut être surchargé par l'utilisateur qui renseigne les champs
   */
  categoriesToTypes: {
    1: {
      typePedagogiques: [9],
      typeDocumentaires: [12]
    },
    2: {
      typePedagogiques: [9],
      typeDocumentaires: [5]
    },
    3: {
      typePedagogiques: [3],
      typeDocumentaires: [12]
    },
    4: {
      typePedagogiques: [3],
      typeDocumentaires: [5]
    },
    5: {
      typePedagogiques: [9],
      typeDocumentaires: [12]
    },
    6: {
      typePedagogiques: [9],
      typeDocumentaires: [5]
    },
    7: {
      typePedagogiques: [9],
      typeDocumentaires: [9]
    },
    8: {
      typePedagogiques: [],
      typeDocumentaires: [1]
    }
  },

  // les propriétés qui ne prennent qu'une seule valeur
  uniques: {
    type: true,
    langue: true,
    restriction: true
  },

  // les propriétés obligatoires
  required: {
    titre: true,
    type: true,
    categories: true
    // 'auteurs'
  },
  // la liste des champs qu'un indexateur peut modifier
  indexFields: {
    titre: true,
    resume: true,
    description: true,
    commentaires: true,
    niveaux: true,
    categories: true,
    typePedagogiques: true,
    typeDocumentaires: true,
    relations: true
  },

  /** libellés que l'on affiche pour chaque champ obligatoire (les fonctions qui peuplent les vues bouclent dessus) */
  labels: {
    oid: 'Identifiant',
    origine: 'Origine',
    idOrigine: "Identifiant d'origine",
    cle: 'Clé de lecture',
    aliasOf: 'Alias de',
    type: 'Type technique',
    titre: 'Titre',
    resume: 'Résumé',
    description: 'Description',
    commentaires: 'Commentaires (réservés au formateur)',
    parametres: 'Paramètres',
    niveaux: 'Niveaux',
    categories: 'Catégories',
    typePedagogiques: 'Type pédagogique',
    typeDocumentaires: 'Type documentaire',
    relations: 'Ressources liées',
    auteurs: 'Auteurs',
    auteursParents: 'Auteurs originaux',
    contributeurs: 'Contributeurs',
    groupes: 'Groupes de publication',
    groupesAuteurs: 'Groupes éditeurs',
    langue: 'Langue',
    publie: 'Publié',
    restriction: 'Restriction',
    dateCreation: 'Date de création',
    dateMiseAJour: 'Date de mise à jour',
    version: 'Version',
    indexable: 'Indexable',
    // facultatifs
    enfants: 'Enfants' // utilisé seulement pour les arbres (à la place de parametres)
  },

  // les propriétés dont la modif déclenche un upgrade de version
  versionTriggers: ['origine', 'idOrigine', 'parametres', 'enfants', 'auteurs', 'contributeurs'],
  // les propriétés supplémentaires dont la modif déclenche l'incrément de publicSuffix sans changer de version
  incTrigger: ['titre', 'resume', 'description', 'commentaires', 'version'],

  // ATTENTION, pour les types faut être cohérent avec les filtres du constructeur Ressource
  // les types requis (il faut la même liste de propriétés que labels, et des valeurs * dont _.is* existe)
  // Number sera traité comme entier positif
  typesVar: {
    oid: 'Number',
    origine: 'String',
    idOrigine: 'String',
    cle: 'String',
    aliasOf: 'String',
    type: 'String',
    titre: 'String',
    resume: 'String',
    description: 'String',
    commentaires: 'String',
    parametres: 'Object',
    niveaux: 'Array',
    categories: 'Array',
    typePedagogiques: 'Array',
    typeDocumentaires: 'Array',
    relations: 'Array',
    auteurs: 'Array',
    auteursParents: 'Array',
    contributeurs: 'Array',
    groupes: 'Array',
    groupesAuteurs: 'Array',
    langue: 'String',
    publie: 'Boolean',
    restriction: 'Number',
    dateCreation: 'Date',
    dateMiseAJour: 'Date',
    version: 'Number',
    indexable: 'Boolean',
    // facultatifs
    enfants: 'Array'
  },
  // pour les typesVar Array, le type de chaque élément
  typesVarArray: {
    niveaux: 'String',
    categories: 'Number',
    typePedagogiques: 'Number',
    typeDocumentaires: 'Number',
    relations: 'Array',
    auteurs: 'String',
    contributeurs: 'String',
    groupes: 'String',
    groupesAuteurs: 'String',
    enfants: 'Object'
  },

  /**
   * Des constantes pour rendre le code plus lisible
   * (en gros un reverse sur les listes d'ids de nos propriétés)
   */
  constantes: {
    categories: {
      activiteFixe: 1,
      activiteAnimee: 2,
      coursFixe: 3,
      coursAnime: 4,
      exerciceFixe: 5,
      exerciceAnime: 6,
      exerciceInteractif: 7,
      liste: 8,
      aucune: 9 // déclenchera un warning dans $ressourceControl.valide
    },
    niveaux: common.constantes.niveaux,
    typePedagogiques: {
      cours: 3,
      exercice: 9,
      corrigeExercice: 91,
      enonceExercice: 92,
      qcm: 191,
      evaluation: 7,
      autoEvaluation: 2,
      sujetExam: 81,
      prepareExam: 82,
      jeuEduc: 13,
      manuel: 141,
      documentReference: 151,
      simulation: 21,
      tutoriel: 22
    },
    typeDocumentaires: {
      animation: 5,
      interactif: 9,
      imageFixe: 6,
      texte: 12,
      son: 11,
      collection: 1,
      dataSet: 2
    },
    relations: {
      assocA: 1,
      estVersionDe: 4,
      existeAussi: 5,
      estRemplacePar: 6,
      remplace: 7,
      estRequisPar: 8,
      requiert: 9,
      estPartieDe: 10,
      contient: 11,
      estRefPar: 12,
      contientRefA: 13,
      estUnFormatDe: 14,
      existeDansFormat: 15,
      estTraductionDe: 16,
      estTraduitAvec: 17,
      aPourVignette: 21,
      aPourCorrige: 51,
      estLaCorrectionDe: 52
    },
    restriction: common.constantes.restriction,
    // des constantes pour nos routes
    routes: common.constantes.routes
  }, // fin constantes
  /**
   * Des formats d'affichage
   */
  formats: {
    jour: 'DD/MM/YYYY'
  },
  limites: {
    listeMax: 1000,
    listeNbDefault: 25
  },
  cacheTTL: 3600,
  imports: {
    ecBase: 'https://ressources.sesamath.net/replication_calculatice'
  }
}

module.exports = configRessource
