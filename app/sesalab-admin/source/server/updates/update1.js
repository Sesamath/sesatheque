var flow = require('an-flow');
var _ = require('lodash');
module.exports = {
  description: 'Converstion des classes en groupes',
  job: function(job) {
    var Structure = lassi.service('Structure');
    var Groupe = lassi.service('Groupe');
    var Utilisateur = lassi.service('Utilisateur');
    flow()
    .seq(function() { Utilisateur.match().grab(this); })
    .flatten()
    .seqEach(function(u) {
      console.log(u);
      u.store(this); })
    .seq(function() { Structure.match().count(this); })
    .seq(function(count) {
      console.log("COUNT", count);
      var ranges = job.init(count, 1000);
      flow(ranges).seqEach(function(range) {
        console.log("RANGE", range);

        flow()
        .seq(function() { Structure.match().grab(range[1], range[0], this); })
        .seqEach(function(structures) {

          flow(structures)
          .seqEach(function(structure) {
            console.log('Stucture ',structure.nom);

            flow(structure.classes)
            .seqEach(function(classe, index) {
              console.log(' Classe', index, classe.nom);

              flow()
              .seq(function() {
                Utilisateur
                .match('structure').equals(structure.oid)
                .match('classe').equals(classe.oid)
                .grab(this);
              })
              .seq(function(eleves) {
                console.log('eleves', eleves.length);
                var groupe = Groupe.create();
                groupe.nom = classe.nom;
                groupe.niveau = classe.niveau;
                groupe.utilisateurs = [];
                _.each(eleves, function(e) {
                  groupe.utilisateurs.push(e.oid);
                })

                flow(eleves)
                .seqEach(function(e) {
                  delete e.classe;
                  e.store(this);
                })
                .seq(function() {
                  console.log('store groue');
                  groupe.store(this);
                })
                .seq(function(groupe) {
                  structure.classes[index] = groupe.oid;
                  structure.store(this);
                  job.tick();
                })
                .done(this);

              })
              .done(this);

            })
            .done(this);

          })
          .done(this);

        })
        .done(this);

      })
      .done(this);

    })
    .done(done);
  }
}
