/**
 * Affiche une popover. Il n'y a qu'une popover visible à un moment T donné.
 * Ainsi si l'on affiche une nouvelle popover alors qu'une ancienne existe, cette
 * dernière est supprimée au profit de la nouvelle.
 *
 * @Service $popover
 */
app.service('$popover', function($compile) {
  var popover, content, _visible;

  /**
   * Initialisation du service
   */
  function initialize() {
    jQuery('html').click(close);
    jQuery('body').append(require('./template.html'));
    jQuery('.an-popover').click(function(event) {
      event.stopPropagation();
    });
    popover = jQuery('.an-popover');
    content = jQuery('.content', popover);
  }
  initialize();

  /**
   * Affichage de la popover
   * @Param {Object} options les options
   * - **template** le template HTML
   * - **event** l'évènement souris passé par le onMouseDown(event)
   * - **scope** Le scope de le popover
   * - **width** La largeur de la popover
   * - **height** La hauteur de la popup
   */
  function show(options) {
    close();

    if (options.actions) {
      options.scope.actions = options.actions;
      options.template = require('./actions.html');
      options.height = 32 * options.actions.length + 10;
      options.scope.doProcessAction = options.scope.doProcessAction || function(action) {
        close();
        action.do();
      }
    }
    var element = $compile(options.template)(options.scope);

    content.html('');
    content.append(element);
    popover.addClass('visible');
    var width = options.width || 300;
    var height = options.height || 300;

    jQuery('.buttons',content).appendTo(popover);
    var triangle = jQuery('.triangle', popover);
    var target = jQuery(options.event.target);
    var offset = target.offset();
    var top = offset.top+target.outerHeight() + 8;
    var left = offset.left - 10;
    if (left < 0) left = 10;
    var screenWidth = jQuery(window).width();
    var screenHeight = jQuery(window).height();
    if ((left+width) > screenWidth) {
      left = screenWidth - width - 10;
      //left = (screenWidth - width) / 2;
    }
    triangle.css({left: offset.left - left - 30 + (target.width()/2)});
    if ((top+height) > screenHeight) {
      top-=height + target.outerHeight() + 16;
      triangle.css({bottom: -13, top:'auto', clip: 'rect(17px, 30px, 28px, 0px)'});
    } else {
      triangle.css({top:-18, bottom: 'auto', clip: 'rect(0, 30px, 18px, 0px)'});
    }
    popover.css({top: top, left: left, height: height, width: width});
    setTimeout(function() {
      _visible = true;
    })
  }

  /**
   * Fermeture de la popover.
   */
  function close() {
    if (!_visible) return;
    content.html('');
    jQuery('.buttons',popover).remove();

    popover.removeClass('visible');
    _visible = false;
  }

  /**
   * Teste la visibilité d'une popover.
   * @return {boolean} vrai si une popover est visible.
   */
  function visible() {
    return popover.hasClass('visible');
  }

  return {
    visible: visible,
    show:show,
    close: close
  }
});

