

/**
 * Un exemple d'appli inline
 * (construit avec `tool/bin/create-application.py -n tree -s sesatheque -o ../tree -t inline`)
 *
 * @asset(sesatheque/*)
 */
qx.Class.define("sesatheque.Application",
{
  extend : qx.application.Inline,

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     * 
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Des choses utiles en global
      window.VError = require('verror');
      window._ = require('lodash');

      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */
      
      
      /*
      -------------------------------------------------------------------------
        USE AN EXISTING NODE TO ADD WIDGETS INTO THE PAGE LAYOUT FLOW
      -------------------------------------------------------------------------
      */
      
      var htmlElement = window.document.getElementById("tree");
      var origine = htmlElement.getAttribute("data-origine");
      var idOrigine = htmlElement.getAttribute("data-idOrigine");
      console.log("on récupère dans le html " +origine +' et ' +idOrigine)

      // Hint: the second and the third parameter control if the dimensions
      // of the element should be respected or not.
      var inlineIsle = new qx.ui.root.Inline(htmlElement, true, true);
      
      // use VBox layout instead of basic
      inlineIsle.setLayout(new qx.ui.layout.VBox);
      
      // new container
      var container = new qx.ui.container.Composite(new qx.ui.layout.HBox);
      var tree = new sesatheque.widgets.Tree();
      tree.set({
        hideRoot: true,
        showTopLevelOpenCloseIcons: true,
        selectionMode: 'multi'
      });
      container.add(tree)

      // add container to the inline root
      inlineIsle.add(container);

      sesatheque.api.Rest.get(idOrigine, origine, this.buildTree);

      /* Create a button
      var button1 = new qx.ui.form.Button("First Button", "sesatheque/test.png");
      button1.setAllowStretchY(false);
      container.add(button1);
      container.setPadding(10);

      // spacer
      var spacer = new qx.ui.core.Spacer();
      container.add(spacer, { flex: 1 });

      // create a date chooser component
      var dateChooser = new qx.ui.control.DateChooser;
      container.add(dateChooser); /* */


      /*
      // Add an event listener
      button1.addListener("execute", function(e) {
        alert("I'm a button inside an inline root widget!\n" + 
              "I nicely fit into the page layout flow.");
      });


      /*
      -------------------------------------------------------------------------
        ADD WIDGETS WITH ABSOLUTE POSITIONING
      -------------------------------------------------------------------------
      * /
      // Create a button
      var button2 = new qx.ui.form.Button("absolutely positioned");

      // Add button to document at fixed coordinates
      this.getRoot().add(button2, {left: 500, top: 310});

      // Add an event listener
      button2.addListener("execute", function(e) {
        alert("I'm an absolutely positioned button!\n" + 
              "I overlay existing content.");
      });
      /* */
    },

    members: {
      buildTree: function (error, result) {
        console.log("dans buildTree on récupère");
        console.log(result);
        this.tree.clean();
        if (error) throw new VError('impossible de récupérer cet arbre');
        _.each(result.enfants, function (enfant) {
          this.processRessource(enfant);
        })
        this.tree.refresh();
      },

      processRessource: function (ressource, parent) {
        var isArbre = ressource.typeTechnique == 'arbre';
        var classe = isArbre ? sesatheque.common.ArbreEntityInfo : sesatheque.common.RessourceEntityInfo;
        ressource.info = new classe(ressource);
        ressource.hasChildren = isArbre;
        ressource.oid = this.oid++;
        var nodeRessource = this.getNodeRessources(ressource, parent);

        var enfants;
        if (ressource.enfants) enfants = ressource.enfants;
        else if (ressource.parametres && ressource.parametres.enfants) enfants = ressource.parametres.enfants;
        if (enfants) {
          for (var i in enfants) {
            this.processRessource(enfants[i], nodeRessource);
          }
        }
      },

      getNodeRessources: function (ressource, parent) {
        parent = parent || this.tree.model;
        var node = parent.need(ressource, {oid: ressource.oid});
        return node;
      },

      onOpenArbre: function (e) {
        var node = e.getData();
        var data = node.data;
        if (!data.ref || data.typeTechnique !== 'arbre') return;
        sesatheque.api.Rest.get(data.ref, data.refOrigine, function (error, result) {
          if (error) throw new VError('impossible de récupérer la ressource ' +ref);
          for (var i in result.enfants) {
            var enfant = result.enfants[i];
            this.processRessource(enfant, node);
          }
          this.tree.openNode(node);
        }, this);
      }
    }
  }
});
