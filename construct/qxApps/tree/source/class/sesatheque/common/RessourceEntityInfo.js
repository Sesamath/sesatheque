qx.Class.define('sesatheque.common.RessourceEntityInfo',
  sesatheque.common.EntityInfo.build({
    name: 'SequenceEntityInfo',
    icon: 'sesatheque/icons/16/waterdrop.png',
    init: function(data) {
      this.setCaption(data.titre||'???');
    }
  },{
    bonnesReponses: {
      type: 'Number',
      defaults: 1,
      widget: {
        label: 'Bonnes Réponses',
        help:
          'Dans une séance ordonnée avec minimum de réussite, vous pouvez décider '+
          'du pourcentage de bonnes réponses minimal à atteindre pour cet exercice '+
          '<strong>afin de pouvoir poursuivre la séance</strong>. '+
          'Dans le cas où ce minimum n\'est pas atteint, l\'élève doit recommencer '+
          'cet exercice.',
        minimum: 1
      }
    },
    nonZapping: {
      type: 'Number',
      defaults: 10,
      widget: {
        label: 'Non Zapping',
        help:
          'Pour éviter que les élèves ne «zappent», il existe un délai de 10 secondes pendant lequel LaboMEP ne les aurorisera pas à changer d\'exercice, une fois celui-ci en marche. Vous pouvez imposer un délai «de non-zapping» supérieur.'+
          'Par ailleurs, vous pouvez imposer un <strong>maximum pour le nombre de visionnage général</strong> d\'une ressource (pour limiter le nombre de fois où un exercice est fait par exemple).<br/>'+
          'Si un délai de non-zapping est choisi ici, il se substitue à l\'éventuel délai '+
          'de non-zapping général défini dans les «Paramétrer» de la séance. '+
          'Il en va de même pour le nombre de visionnage.',
        minimum: 10
      }
    },
    maximumVisionnage: {
      type: 'Number',
      defaults: 1,
      widget: {
        label: 'Max. Visionnage',
        help: 'Imposer un maximim de visionnage général',
        minimum: 1
      }
    }
  }));


