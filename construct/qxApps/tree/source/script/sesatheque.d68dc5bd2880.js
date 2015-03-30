/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Contains some common methods available to all log appenders.
 */
qx.Bootstrap.define("qx.log.appender.Util",
{
  statics :
  {
    /**
     * Converts a single log entry to HTML
     *
     * @signature function(entry)
     * @param entry {Map} The entry to process
     */
    toHtml : function(entry)
    {
      var output = [];
      var item, msg, sub, list;

      output.push("<span class='offset'>", this.formatOffset(entry.offset, 6), "</span> ");

      if (entry.object)
      {
        var obj = entry.win.qx.core.ObjectRegistry.fromHashCode(entry.object);
        if (obj) {
          output.push("<span class='object' title='Object instance with hash code: " + obj.$$hash + "'>", obj.classname, "[" , obj.$$hash, "]</span>: ");
        }
      }
      else if (entry.clazz)
      {
        output.push("<span class='object'>" + entry.clazz.classname, "</span>: ");
      }

      var items = entry.items;
      for (var i=0, il=items.length; i<il; i++)
      {
        item = items[i];
        msg = item.text;

        if (msg instanceof Array)
        {
          var list = [];

          for (var j=0, jl=msg.length; j<jl; j++)
          {
            sub = msg[j];
            if (typeof sub === "string") {
              list.push("<span>" + this.escapeHTML(sub) + "</span>");
            } else if (sub.key) {
              list.push("<span class='type-key'>" + sub.key + "</span>:<span class='type-" + sub.type + "'>" + this.escapeHTML(sub.text) + "</span>");
            } else {
              list.push("<span class='type-" + sub.type + "'>" + this.escapeHTML(sub.text) + "</span>");
            }
          }

          output.push("<span class='type-" + item.type + "'>");

          if (item.type === "map") {
            output.push("{", list.join(", "), "}");
          } else {
            output.push("[", list.join(", "), "]");
          }

          output.push("</span>");
        }
        else
        {
          output.push("<span class='type-" + item.type + "'>" + this.escapeHTML(msg) + "</span> ");
        }
      }

      var wrapper = document.createElement("DIV");
      wrapper.innerHTML = output.join("");
      wrapper.className = "level-" + entry.level;

      return wrapper;
    },


    /**
     * Formats a numeric time offset to 6 characters.
     *
     * @param offset {Integer} Current offset value
     * @param length {Integer?6} Refine the length
     * @return {String} Padded string
     */
    formatOffset : function(offset, length)
    {
      var str = offset.toString();
      var diff = (length||6) - str.length;
      var pad = "";

      for (var i=0; i<diff; i++) {
        pad += "0";
      }

      return pad+str;
    },


    /**
     * Escapes the HTML in the given value
     *
     * @param value {String} value to escape
     * @return {String} escaped value
     */
    escapeHTML : function(value) {
      return String(value).replace(/[<>&"']/g, this.__escapeHTMLReplace);
    },


    /**
     * Internal replacement helper for HTML escape.
     *
     * @param ch {String} Single item to replace.
     * @return {String} Replaced item
     */
    __escapeHTMLReplace : function(ch)
    {
      var map =
      {
        "<" : "&lt;",
        ">" : "&gt;",
        "&" : "&amp;",
        "'" : "&#39;",
        '"' : "&quot;"
      };

      return map[ch] || "?";
    },


    /**
     * Converts a single log entry to plain text
     *
     * @param entry {Map} The entry to process
     * @return {String} the formatted log entry
     */
    toText : function(entry) {
      return this.toTextArray(entry).join(" ");
    },


    /**
     * Converts a single log entry to an array of plain text
     *
     * @param entry {Map} The entry to process
     * @return {Array} Argument list ready message array.
     */
    toTextArray : function(entry)
    {
      var output = [];

      output.push(this.formatOffset(entry.offset, 6));

      if (entry.object)
      {
        var obj = entry.win.qx.core.ObjectRegistry.fromHashCode(entry.object);
        if (obj) {
          output.push(obj.classname + "[" + obj.$$hash + "]:");
        }
      }
      else if (entry.clazz) {
        output.push(entry.clazz.classname + ":");
      }

      var items = entry.items;
      var item, msg;
      for (var i=0, il=items.length; i<il; i++)
      {
        item = items[i];
        msg = item.text;

        if (item.trace && item.trace.length > 0) {
          if (typeof(this.FORMAT_STACK) == "function") {
            qx.log.Logger.deprecatedConstantWarning(qx.log.appender.Util,
              "FORMAT_STACK",
              "Use qx.dev.StackTrace.FORMAT_STACKTRACE instead");
            msg += "\n" + this.FORMAT_STACK(item.trace);
          } else {
            msg += "\n" + item.trace;
          }
        }

        if (msg instanceof Array)
        {
          var list = [];
          for (var j=0, jl=msg.length; j<jl; j++) {
            list.push(msg[j].text);
          }

          if (item.type === "map") {
            output.push("{", list.join(", "), "}");
          } else {
            output.push("[", list.join(", "), "]");
          }
        }
        else
        {
          output.push(msg);
        }
      }

      return output;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Processes the incoming log entry and displays it by means of the native
 * logging capabilities of the client.
 *
 * Supported browsers:
 * * Firefox <4 using FireBug (if available).
 * * Firefox >=4 using the Web Console.
 * * WebKit browsers using the Web Inspector/Developer Tools.
 * * Internet Explorer 8+ using the F12 Developer Tools.
 * * Opera >=10.60 using either the Error Console or Dragonfly
 *
 * Currently unsupported browsers:
 * * Opera <10.60
 *
 * @require(qx.log.appender.Util)
 * @require(qx.bom.client.Html)
 */
qx.Bootstrap.define("qx.log.appender.Native",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Processes a single log entry
     *
     * @param entry {Map} The entry to process
     */
    process : function(entry)
    {
      if (qx.core.Environment.get("html.console")) {
        // Firefox 4's Web Console doesn't support "debug"
        var level = console[entry.level] ? entry.level : "log";
        if (console[level]) {
          var args = qx.log.appender.Util.toText(entry);
          console[level](args);
        }
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.log.Logger.register(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Feature-rich console appender for the qooxdoo logging system.
 *
 * Creates a small inline element which is placed in the top-right corner
 * of the window. Prints all messages with a nice color highlighting.
 *
 * * Allows user command inputs.
 * * Command history enabled by default (Keyboard up/down arrows).
 * * Lazy creation on first open.
 * * Clearing the console using a button.
 * * Display of offset (time after loading) of each message
 * * Supports keyboard shortcuts F7 or Ctrl+D to toggle the visibility
 *
 * @require(qx.event.handler.Window)
 * @require(qx.event.handler.Keyboard)
 * @require(qx.event.handler.Gesture)
 */
qx.Class.define("qx.log.appender.Console",
{
  statics :
  {
    /*
    ---------------------------------------------------------------------------
      INITIALIZATION AND SHUTDOWN
    ---------------------------------------------------------------------------
    */

   __main : null,

   __log : null,

   __cmd : null,

   __lastCommand : null,

    /**
     * Initializes the console, building HTML and pushing last
     * log messages to the output window.
     *
     */
    init : function()
    {
      // Build style sheet content
      var style =
      [
        '.qxconsole{z-index:10000;width:600px;height:300px;top:0px;right:0px;position:absolute;border-left:1px solid black;color:black;border-bottom:1px solid black;color:black;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.2;}',

        '.qxconsole .control{background:#cdcdcd;border-bottom:1px solid black;padding:4px 8px;}',
        '.qxconsole .control a{text-decoration:none;color:black;}',

        '.qxconsole .messages{background:white;height:100%;width:100%;overflow:auto;}',
        '.qxconsole .messages div{padding:0px 4px;}',

        '.qxconsole .messages .user-command{color:blue}',
        '.qxconsole .messages .user-result{background:white}',
        '.qxconsole .messages .user-error{background:#FFE2D5}',
        '.qxconsole .messages .level-debug{background:white}',
        '.qxconsole .messages .level-info{background:#DEEDFA}',
        '.qxconsole .messages .level-warn{background:#FFF7D5}',
        '.qxconsole .messages .level-error{background:#FFE2D5}',
        '.qxconsole .messages .level-user{background:#E3EFE9}',
        '.qxconsole .messages .type-string{color:black;font-weight:normal;}',
        '.qxconsole .messages .type-number{color:#155791;font-weight:normal;}',
        '.qxconsole .messages .type-boolean{color:#15BC91;font-weight:normal;}',
        '.qxconsole .messages .type-array{color:#CC3E8A;font-weight:bold;}',
        '.qxconsole .messages .type-map{color:#CC3E8A;font-weight:bold;}',
        '.qxconsole .messages .type-key{color:#565656;font-style:italic}',
        '.qxconsole .messages .type-class{color:#5F3E8A;font-weight:bold}',
        '.qxconsole .messages .type-instance{color:#565656;font-weight:bold}',
        '.qxconsole .messages .type-stringify{color:#565656;font-weight:bold}',

        '.qxconsole .command{background:white;padding:2px 4px;border-top:1px solid black;}',
        '.qxconsole .command input{width:100%;border:0 none;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.2;}',
        '.qxconsole .command input:focus{outline:none;}'
      ];

      // Include stylesheet
      qx.bom.Stylesheet.createElement(style.join(""));

      // Build markup
      var markup =
      [
        '<div class="qxconsole">',
        '<div class="control"><a href="javascript:qx.log.appender.Console.clear()">Clear</a> | <a href="javascript:qx.log.appender.Console.toggle()">Hide</a></div>',
        '<div class="messages">',
        '</div>',
        '<div class="command">',
        '<input type="text"/>',
        '</div>',
        '</div>'
      ];

      // Insert HTML to access DOM node
      var wrapper = document.createElement("DIV");
      wrapper.innerHTML = markup.join("");
      var main = wrapper.firstChild;
      document.body.appendChild(wrapper.firstChild);

      // Make important DOM nodes available
      this.__main = main;
      this.__log = main.childNodes[1];
      this.__cmd = main.childNodes[2].firstChild;

      // Correct height of messages frame
      this.__onResize();

      // Finally register to log engine
      qx.log.Logger.register(this);

      // Register to object manager
      qx.core.ObjectRegistry.register(this);
    },


    /**
     * Used by the object registry to dispose this instance e.g. remove listeners etc.
     *
     */
    dispose : function()
    {
      qx.event.Registration.removeListener(document.documentElement, "keypress", this.__onKeyPress, this);
      qx.log.Logger.unregister(this);
    },





    /*
    ---------------------------------------------------------------------------
      INSERT & CLEAR
    ---------------------------------------------------------------------------
    */

    /**
     * Clears the current console output.
     *
     */
    clear : function()
    {
      // Remove all messages
      this.__log.innerHTML = "";
    },


    /**
     * Processes a single log entry
     *
     * @signature function(entry)
     * @param entry {Map} The entry to process
     */
    process : function(entry)
    {
      // Append new content
      this.__log.appendChild(qx.log.appender.Util.toHtml(entry));

      // Scroll down
      this.__scrollDown();
    },


    /**
     * Automatically scroll down to the last line
     */
    __scrollDown : function() {
      this.__log.scrollTop = this.__log.scrollHeight;
    },





    /*
    ---------------------------------------------------------------------------
      VISIBILITY TOGGLING
    ---------------------------------------------------------------------------
    */

    /** @type {Boolean} Flag to store last visibility status */
    __visible : true,


    /**
     * Toggles the visibility of the console between visible and hidden.
     *
     */
    toggle : function()
    {
      if (!this.__main)
      {
        this.init();
      }
      else if (this.__main.style.display == "none")
      {
        this.show();
      }
      else
      {
        this.__main.style.display = "none";
      }
    },


    /**
     * Shows the console.
     *
     */
    show : function()
    {
      if (!this.__main) {
        this.init();
      } else {
        this.__main.style.display = "block";
        this.__log.scrollTop = this.__log.scrollHeight;
      }
    },


    /*
    ---------------------------------------------------------------------------
      COMMAND LINE SUPPORT
    ---------------------------------------------------------------------------
    */

    /** @type {Array} List of all previous commands. */
    __history : [],


    /**
     * Executes the currently given command
     *
     */
    execute : function()
    {
      var value = this.__cmd.value;
      if (value == "") {
        return;
      }

      if (value == "clear") {
        this.clear();
        return;
      }

      var command = document.createElement("div");
      command.innerHTML = qx.log.appender.Util.escapeHTML(">>> " + value);
      command.className = "user-command";

      this.__history.push(value);
      this.__lastCommand = this.__history.length;
      this.__log.appendChild(command);
      this.__scrollDown();

      try {
        var ret = window.eval(value);
      }
      catch (ex) {
        qx.log.Logger.error(ex);
      }

      if (ret !== undefined) {
        qx.log.Logger.debug(ret);
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Event handler for resize listener
     *
     * @param e {Event} Event object
     */
    __onResize : function(e) {
      this.__log.style.height = (this.__main.clientHeight - this.__main.firstChild.offsetHeight - this.__main.lastChild.offsetHeight) + "px";
    },


    /**
     * Event handler for keydown listener
     *
     * @param e {Event} Event object
     */
    __onKeyPress : function(e)
    {
      if (e instanceof qx.event.type.Tap || e instanceof qx.event.type.Pointer) {
        var target = e.getTarget();
        if (target && target.className && target.className.indexOf && target.className.indexOf("navigationbar") != -1) {
          this.toggle();
        }
        return;
      }

      var iden = e.getKeyIdentifier();

      // Console toggling
      if ((iden == "F7") || (iden == "D" && e.isCtrlPressed()))
      {
        this.toggle();
        e.preventDefault();
      }

      // Not yet created
      if (!this.__main) {
        return;
      }

      // Active element not in console
      if (!qx.dom.Hierarchy.contains(this.__main, e.getTarget())) {
        return;
      }

      // Command execution
      if (iden == "Enter" && this.__cmd.value != "")
      {
        this.execute();
        this.__cmd.value = "";
      }

      // History managment
      if (iden == "Up" || iden == "Down")
      {
        this.__lastCommand += iden == "Up" ? -1 : 1;
        this.__lastCommand = Math.min(Math.max(0, this.__lastCommand), this.__history.length);

        var entry = this.__history[this.__lastCommand];
        this.__cmd.value = entry || "";
        this.__cmd.select();
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addListener(document.documentElement, "keypress", statics.__onKeyPress, statics);
    qx.event.Registration.addListener(document.documentElement, "longtap", statics.__onKeyPress, statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Alexander Steitz (aback)

************************************************************************ */

/**
 * This classes could be used to insert qooxdoo islands into existing
 * web pages. You can use the isles to place any qooxdoo powered widgets
 * inside a layout made using traditional HTML markup and CSS.
 *
 * The size of the widget in each dimension can either be determined by the
 * size hint of the inline's children or by the size of the root DOM element. If
 * <code>dynamicX</code>/<code>dynamicY</code> is true the width/height of the DOM
 * element is used.
 *
 * This class uses {@link qx.ui.layout.Basic} as default layout. The layout
 * can be changed using the {@link #setLayout} method.
 *
 * To position popups and tooltips please have a look at {@link qx.ui.root.Page}.
 *
 * @use(qx.event.handler.ElementResize)
 * @ignore(qx.ui.popup, qx.ui.popup.Manager.*)
 * @ignore(qx.ui.menu, qx.ui.menu.Manager.*)
 */
qx.Class.define("qx.ui.root.Inline",
{
  extend : qx.ui.root.Abstract,
  include : [qx.ui.core.MLayoutHandling],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param el {Element} DOM element to use as isle for qooxdoo content. Please
   *    note that existing content gets removed on the first layout flush.
   * @param dynamicX {Boolean} If <code>true</code> the widget's width is
   *    determined by the DOM element's width. Otherwise the children's size hint
   *    is used.
   * @param dynamicY {Boolean} If <code>true</code> the widget's height is
   *    determined by the DOM element's height. Otherwise the children's size hint
   *    is used.
   */
  construct : function(el, dynamicX, dynamicY)
  {
    // check the parameter
    if (qx.core.Environment.get("qx.debug")) {
      this.assertElement(el, "Please use a DOM element to create an inline root.");
    }

    // Temporary storage of element to use
    this.__elem = el;

    // Avoid any problems with dynamic resizing
    el.style.overflow = "hidden";

    // Avoid any problems with broken layout
    el.style.textAlign = "left";

    this.__dynX = dynamicX || false;
    this.__dynY = dynamicY || false;
    this.__initDynamicMode();

    this.base(arguments);

    // Use static layout
    this._setLayout(new qx.ui.layout.Basic());

    // Directly schedule layout for root element
    qx.ui.core.queue.Layout.add(this);

    // Register as root
    qx.ui.core.FocusHandler.getInstance().connectTo(this);

    // Avoid the automatically scroll in to view.
    // See http://bugzilla.qooxdoo.org/show_bug.cgi?id=3236 for details.
    if ((qx.core.Environment.get("engine.name") == "mshtml")) {
      this.setKeepFocus(true);
    }

    // Resize handling for the window
    var window = qx.dom.Node.getWindow(el);
    qx.event.Registration.addListener(window, "resize", this._onWindowResize, this);

    // quick fix for [BUG #7680]
    this.getContentElement().setStyle("-webkit-backface-visibility", "hidden");
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __dynX : false,
    __dynY : false,
    __elem : null,


    /**
     * Performs several checks for dynamic mode and adds the "resize" listener
     */
    __initDynamicMode : function()
    {
      if (this.__dynX || this.__dynY)
      {
        // Check the DOM element for an usable width and height
        var elementDimensions = qx.bom.element.Dimension.getSize(this.__elem);

        if (this.__dynX && elementDimensions.width < 1) {
          throw new Error("The root element " + this.__elem + " of " + this +
            " needs a width when its width size should be used!");
        }

        if (this.__dynY)
        {
          if (elementDimensions.height < 1) {
            throw new Error("The root element " + this.__elem + " of " + this +
            " needs a height when its height size should be used!");
          }

          // check for implicit height. Set the height explicit to prevent that
          // the element grows indefinetely
          if (elementDimensions.height >= 1 &&
              qx.bom.element.Style.get(this.__elem, "height", 3) == "") {
            qx.bom.element.Style.set(this.__elem, "height", elementDimensions.height + "px");
          }
        }

        qx.event.Registration.addListener(this.__elem, "resize", this._onResize, this);
      }
    },


    // overridden
    _createContentElement : function()
    {
      var el = this.__elem;

      if (this.__dynX || this.__dynY)
      {
        var rootEl = document.createElement("div");
        el.appendChild(rootEl);
      } else {
        rootEl = el;
      }

      var root = new qx.html.Root(rootEl);

      // Make relative
      rootEl.style.position = "relative";

      // Store "weak" reference to the widget in the DOM element.
      root.setAttribute("$$widget", this.toHashCode());

      // fire event asynchronously, otherwise the browser will fire the event
      // too early and no listener will be informed since they're not added
      // at this time
      qx.event.Timer.once(function(e) {
        this.fireEvent("appear");
      }, this, 0);

      return root;
    },


    /**
     * Listener for the element's resize event
     *
     * @param e {qx.event.type.Event} Event object
     */
    _onResize : function(e)
    {
      var data = e.getData();
      if (
        (data.oldWidth !== data.width) && this.__dynX ||
        (data.oldHeight !== data.height) && this.__dynY
      ) {
        qx.ui.core.queue.Layout.add(this);
      }
    },


    /**
     * Listener for the window's resize event.
     */
    _onWindowResize : function() {
      // close all popups
      if (qx.ui.popup && qx.ui.popup.Manager) {
        qx.ui.popup.Manager.getInstance().hideAll();
      }

      // close all menus
      if (qx.ui.menu && qx.ui.menu.Manager) {
        qx.ui.menu.Manager.getInstance().hideAll();
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      var dynX = this.__dynX;
      var dynY = this.__dynY;

      if (!dynX || !dynY) {
        var hint = this.base(arguments);
      } else {
        hint = {};
      }

      var Dimension = qx.bom.element.Dimension;

      if (dynX)
      {
        var width = Dimension.getContentWidth(this.__elem);
        hint.width = width;
        hint.minWidth = width;
        hint.maxWidth = width;
      }

      if (dynY)
      {
        var height = Dimension.getContentHeight(this.__elem);
        hint.height = height;
        hint.minHeight = height;
        hint.maxHeight = height;
      }

      return hint;
    }
  },





  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics, members) {
    qx.ui.core.MLayoutHandling.remap(members);
  },


  /*
  *****************************************************************************
     DESTRUCT
  *****************************************************************************
  */

  destruct : function()
  {
    qx.event.Registration.removeListener(this.__elem, "resize", this._onResize, this);
    this.__elem = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This handler fires a <code>resize</code> event if the size of a DOM element
 * changes.
 */
qx.Class.define("qx.event.handler.ElementResize",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager)
  {
    this.base(arguments);

    this.__manager = manager;
    this.__elements = {};

    this.__timer = new qx.event.Timer(200);
    this.__timer.addListener("interval", this._onInterval, this);
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** @type {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,


    /** @type {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      resize : true
    },


    /** @type {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_DOMNODE,


    /** @type {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : false
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __elements : null,
    __manager : null,
    __timer : null,


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {
      return target.tagName.toLowerCase() !== "body";
    },


    // interface implementation
    registerEvent : function(target, type, capture)
    {
      var hash = qx.core.ObjectRegistry.toHashCode(target);

      var elements = this.__elements;
      if (!elements[hash])
      {
        elements[hash] = {
          element: target,
          width: qx.bom.element.Dimension.getWidth(target),
          height: qx.bom.element.Dimension.getHeight(target)
        };
        this.__timer.start();
      }
    },


    // interface implementation
    unregisterEvent : function(target, type, capture)
    {
      var hash = qx.core.ObjectRegistry.toHashCode(target);

      var elements = this.__elements;
      if (elements[hash])
      {
        delete elements[hash];

        if (qx.lang.Object.isEmpty(elements)) {
          this.__timer.stop();
        }
      }
    },


    /**
     * Checks elements for width and height changes and fires resize event
     * if needed.
     *
     * @param e {qx.event.type.Data} The incoming data event
     */
    _onInterval : function(e)
    {
      var elements = this.__elements;
      for (var key in elements)
      {
        var data = elements[key];

        var el = data.element;
        var width = qx.bom.element.Dimension.getWidth(el);
        var height = qx.bom.element.Dimension.getHeight(el);

        if (data.height !== height || data.width !== width)
        {
          qx.event.Registration.fireNonBubblingEvent(
            el,
            "resize",
            qx.event.type.Data,
            [{
              width: width,
              oldWidth: data.width,
              height: height,
              oldHeight: data.height
            }]
          );

          data.width = width;
          data.height = height;
        }
      }
    }
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this.__manager = this.__elements = null;
    this._disposeObjects("__timer");
  },






  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addHandler(statics);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A vertical box layout.
 *
 * The vertical box layout lays out widgets in a vertical column, from top
 * to bottom.
 *
 * *Features*
 *
 * * Minimum and maximum dimensions
 * * Prioritized growing/shrinking (flex)
 * * Margins (with vertical collapsing)
 * * Auto sizing (ignoring percent values)
 * * Percent heights (not relevant for size hint)
 * * Alignment (child property {@link qx.ui.core.LayoutItem#alignY} is ignored)
 * * Vertical spacing (collapsed with margins)
 * * Reversed children layout (from last to first)
 * * Horizontal children stretching (respecting size hints)
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>flex</strong> <em>(Integer)</em>: The flexibility of a layout item determines how the container
 *   distributes remaining empty space among its children. If items are made
 *   flexible, they can grow or shrink accordingly. Their relative flex values
 *   determine how the items are being resized, i.e. the larger the flex ratio
 *   of two items, the larger the resizing of the first item compared to the
 *   second.
 *
 *   If there is only one flex item in a layout container, its actual flex
 *   value is not relevant. To disallow items to become flexible, set the
 *   flex value to zero.
 * </li>
 * <li><strong>height</strong> <em>(String)</em>: Allows to define a percent
 *   height for the item. The height in percent, if specified, is used instead
 *   of the height defined by the size hint. The minimum and maximum height still
 *   takes care of the element's limits. It has no influence on the layout's
 *   size hint. Percent values are mostly useful for widgets which are sized by
 *   the outer hierarchy.
 * </li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the vertical box layout.
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.VBox();
 * layout.setSpacing(4); // apply spacing
 *
 * var container = new qx.ui.container.Composite(layout);
 *
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * </pre>
 *
 * *External Documentation*
 *
 * See <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/box.html'>extended documentation</a>
 * and links to demos for this layout.
 *
 */
qx.Class.define("qx.ui.layout.VBox",
{
  extend : qx.ui.layout.Abstract,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param spacing {Integer?0} The spacing between child widgets {@link #spacing}.
   * @param alignY {String?"top"} Vertical alignment of the whole children
   *     block {@link #alignY}.
   * @param separator {String|qx.ui.decoration.IDecorator} A separator to render between the items
   */
  construct : function(spacing, alignY, separator)
  {
    this.base(arguments);

    if (spacing) {
      this.setSpacing(spacing);
    }

    if (alignY) {
      this.setAlignY(alignY);
    }

    if (separator) {
      this.setSeparator(separator);
    }
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Vertical alignment of the whole children block. The vertical
     * alignment of the child is completely ignored in VBoxes (
     * {@link qx.ui.core.LayoutItem#alignY}).
     */
    alignY :
    {
      check : [ "top", "middle", "bottom" ],
      init : "top",
      apply : "_applyLayoutChange"
    },


    /**
     * Horizontal alignment of each child. Can be overridden through
     * {@link qx.ui.core.LayoutItem#alignX}.
     */
    alignX :
    {
      check : [ "left", "center", "right" ],
      init : "left",
      apply : "_applyLayoutChange"
    },


    /** Vertical spacing between two children */
    spacing :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    },


    /** Separator lines to use between the objects */
    separator :
    {
      check : "Decorator",
      nullable : true,
      apply : "_applyLayoutChange"
    },


    /** Whether the actual children list should be laid out in reversed order. */
    reversed :
    {
      check : "Boolean",
      init : false,
      apply : "_applyReversed"
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __heights : null,
    __flexs : null,
    __enableFlex : null,
    __children : null,


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyReversed : function()
    {
      // easiest way is to invalidate the cache
      this._invalidChildrenCache = true;

      // call normal layout change
      this._applyLayoutChange();
    },


    /**
     * Rebuilds caches for flex and percent layout properties
     */
    __rebuildCache : function()
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var enableFlex = false;
      var reuse = this.__heights && this.__heights.length != length && this.__flexs && this.__heights;
      var props;

      // Sparse array (keep old one if lengths has not been modified)
      var heights = reuse ? this.__heights : new Array(length);
      var flexs = reuse ? this.__flexs : new Array(length);

      // Reverse support
      if (this.getReversed()) {
        children = children.concat().reverse();
      }

      // Loop through children to preparse values
      for (var i=0; i<length; i++)
      {
        props = children[i].getLayoutProperties();

        if (props.height != null) {
          heights[i] = parseFloat(props.height) / 100;
        }

        if (props.flex != null)
        {
          flexs[i] = props.flex;
          enableFlex = true;
        } else {
          // reset (in case the index of the children changed: BUG #3131)
          flexs[i] = 0;
        }
      }

      // Store data
      if (!reuse)
      {
        this.__heights = heights;
        this.__flexs = flexs;
      }

      this.__enableFlex = enableFlex
      this.__children = children;

      // Clear invalidation marker
      delete this._invalidChildrenCache;
    },





    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        this.assert(name === "flex" || name === "height", "The property '"+name+"' is not supported by the VBox layout!");

        if (name =="height")
        {
          this.assertMatch(value, qx.ui.layout.Util.PERCENT_VALUE);
        }
        else
        {
          // flex
          this.assertNumber(value);
          this.assert(value >= 0);
        }
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      // Rebuild flex/height caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      // Cache children
      var children = this.__children;
      var length = children.length;
      var util = qx.ui.layout.Util;


      // Compute gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeVerticalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeVerticalGaps(children, spacing, true);
      }


      // First run to cache children data and compute allocated height
      var i, child, height, percent;
      var heights = [];
      var allocatedHeight = gaps;

      for (i=0; i<length; i+=1)
      {
        percent = this.__heights[i];

        height = percent != null ?
          Math.floor((availHeight - gaps) * percent) :
          children[i].getSizeHint().height;

        heights.push(height);
        allocatedHeight += height;
      }


      // Flex support (growing/shrinking)
      if (this.__enableFlex && allocatedHeight != availHeight)
      {
        var flexibles = {};
        var flex, offset;

        for (i=0; i<length; i+=1)
        {
          flex = this.__flexs[i];

          if (flex > 0)
          {
            hint = children[i].getSizeHint();

            flexibles[i]=
            {
              min : hint.minHeight,
              value : heights[i],
              max : hint.maxHeight,
              flex : flex
            };
          }
        }

        var result = util.computeFlexOffsets(flexibles, availHeight, allocatedHeight);

        for (i in result)
        {
          offset = result[i].offset;

          heights[i] += offset;
          allocatedHeight += offset;
        }
      }


      // Start with top coordinate
      var top = children[0].getMarginTop();

      // Alignment support
      if (allocatedHeight < availHeight && this.getAlignY() != "top")
      {
        top = availHeight - allocatedHeight;

        if (this.getAlignY() === "middle") {
          top = Math.round(top / 2);
        }
      }


      // Layouting children
      var hint, left, width, height, marginBottom, marginLeft, marginRight;

      // Pre configure separators
      this._clearSeparators();

      // Compute separator height
      if (separator)
      {
        var separatorInsets = qx.theme.manager.Decoration.getInstance().resolve(separator).getInsets();
        var separatorHeight = separatorInsets.top + separatorInsets.bottom;
      }

      // Render children and separators
      for (i=0; i<length; i+=1)
      {
        child = children[i];
        height = heights[i];
        hint = child.getSizeHint();

        marginLeft = child.getMarginLeft();
        marginRight = child.getMarginRight();

        // Find usable width
        width = Math.max(hint.minWidth, Math.min(availWidth-marginLeft-marginRight, hint.maxWidth));

        // Respect horizontal alignment
        left = util.computeHorizontalAlignOffset(child.getAlignX()||this.getAlignX(), width, availWidth, marginLeft, marginRight);

        // Add collapsed margin
        if (i > 0)
        {
          // Whether a separator has been configured
          if (separator)
          {
            // add margin of last child and spacing
            top += marginBottom + spacing;

            // then render the separator at this position
            this._renderSeparator(separator, {
              top : top + padding.top,
              left : padding.left,
              height : separatorHeight,
              width : availWidth
            });

            // and finally add the size of the separator, the spacing (again) and the top margin
            top += separatorHeight + spacing + child.getMarginTop();
          }
          else
          {
            // Support margin collapsing when no separator is defined
            top += util.collapseMargins(spacing, marginBottom, child.getMarginTop());
          }
        }

        // Layout child
        child.renderLayout(left + padding.left, top + padding.top, width, height);

        // Add height
        top += height;

        // Remember bottom margin (for collapsing)
        marginBottom = child.getMarginBottom();
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      // Rebuild flex/height caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      var util = qx.ui.layout.Util;
      var children = this.__children;

      // Initialize
      var minHeight=0, height=0, percentMinHeight=0;
      var minWidth=0, width=0;
      var child, hint, margin;

      // Iterate over children
      for (var i=0, l=children.length; i<l; i+=1)
      {
        child = children[i];
        hint = child.getSizeHint();

        // Sum up heights
        height += hint.height;

        // Detect if child is shrinkable or has percent height and update minHeight
        var flex = this.__flexs[i];
        var percent = this.__heights[i];
        if (flex) {
          minHeight += hint.minHeight;
        } else if (percent) {
          percentMinHeight = Math.max(percentMinHeight, Math.round(hint.minHeight/percent));
        } else {
          minHeight += hint.height;
        }

        // Build horizontal margin sum
        margin = child.getMarginLeft() + child.getMarginRight();

        // Find biggest width
        if ((hint.width+margin) > width) {
          width = hint.width + margin;
        }

        // Find biggest minWidth
        if ((hint.minWidth+margin) > minWidth) {
          minWidth = hint.minWidth + margin;
        }
      }

      minHeight += percentMinHeight;

      // Respect gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeVerticalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeVerticalGaps(children, spacing, true);
      }

      // Return hint
      return {
        minHeight : minHeight + gaps,
        height : height + gaps,
        minWidth : minWidth,
        width : width
      };
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__heights = this.__flexs = this.__children = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Implements the different selection modes single, multi, additive and one
 * selection with there drag and quick selection.
 *
 * Example how to use selection:
 * <pre class="javascript">
 * var rawData = [];
 * for (var i = 0; i < 2500; i++) {
 *  rawData[i] = "Item No " + i;
 * }
 *
 * var model = qx.data.marshal.Json.createModel(rawData);
 * var list = new qx.ui.list.List(model);
 *
 * // Pre-Select "Item No 20"
 * list.getSelection().push(model.getItem(20));
 *
 * // log change selection
 * list.getSelection().addListener("change", function(e) {
 *   this.debug("Selection: " + list.getSelection().getItem(0));
 * }, this);
 * </pre>
 *
 * @internal
 */
qx.Mixin.define("qx.ui.virtual.selection.MModel",
{
  construct : function()
  {
    this._initSelectionManager();
    this.__defaultSelection = new qx.data.Array();
    this.initSelection(this.__defaultSelection);
  },


  properties :
  {
    /** Current selected items */
    selection :
    {
      check : "qx.data.Array",
      event : "changeSelection",
      apply : "_applySelection",
      nullable : false,
      deferredInit : true
    },


    /**
     * The selection mode to use.
     *
     * For further details please have a look at:
     * {@link qx.ui.core.selection.Abstract#mode}
     */
    selectionMode :
    {
      check : ["single", "multi", "additive", "one"],
      init : "single",
      apply : "_applySelectionMode"
    },


    /**
     * Enable drag selection (multi selection of items through
     * dragging the pointer in pressed states).
     *
     * Only possible for the selection modes <code>multi</code> and <code>additive</code>
     */
    dragSelection :
    {
      check : "Boolean",
      init : false,
      apply : "_applyDragSelection"
    },


    /**
     * Enable quick selection mode, where no tap is needed to change the selection.
     *
     * Only possible for the modes <code>single</code> and <code>one</code>.
     */
    quickSelection :
    {
      check : "Boolean",
      init : false,
      apply : "_applyQuickSelection"
    }
  },


  events : {
    /**
     * This event is fired as soon as the content of the selection property changes, but
     * this is not equal to the change of the selection of the widget. If the selection
     * of the widget changes, the content of the array stored in the selection property
     * changes. This means you have to listen to the change event of the selection array
     * to get an event as soon as the user changes the selected item.
     * <pre class="javascript">obj.getSelection().addListener("change", listener, this);</pre>
     */
    "changeSelection" : "qx.event.type.Data"
  },


  members :
  {
    /** @type {qx.ui.virtual.selection.Row} selection manager */
    _manager : null,


    /** @type {Boolean} flag to ignore the selection change from {@link #selection} */
    __ignoreChangeSelection : false,


    /** @type {Boolean} flag to ignore the selection change from <code>_manager</code> */
    __ignoreManagerChangeSelection : false,

    __defaultSelection : null,


    /**
     * Initialize the selection manager with his delegate.
     */
    _initSelectionManager : function()
    {
      var self = this;
      var selectionDelegate =
      {
        isItemSelectable : function(row) {
          return self._provider.isSelectable(row);
        },

        styleSelectable : function(row, type, wasAdded)
        {
          if (type != "selected") {
            return;
          }

          if (wasAdded) {
            self._provider.styleSelectabled(row);
          } else {
            self._provider.styleUnselectabled(row);
          }
        }
      }

      this._manager = new qx.ui.virtual.selection.Row(
        this.getPane(), selectionDelegate
      );
      this._manager.attachPointerEvents(this.getPane());
      this._manager.attachKeyEvents(this);
      this._manager.addListener("changeSelection", this._onManagerChangeSelection, this);
    },


    /**
     * Method to update the selection, this method can be used when the model has
     * changes.
     */
    _updateSelection : function()
    {
      if (this._manager == null) {
        return;
      }

      this._onChangeSelection();
    },


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */


    // apply method
    _applySelection : function(value, old)
    {
      value.addListener("change", this._onChangeSelection, this);

      if (old != null) {
        old.removeListener("change", this._onChangeSelection, this);
      }

      this._onChangeSelection();
    },


    // apply method
    _applySelectionMode : function(value, old) {
      this._manager.setMode(value);
    },


    // apply method
    _applyDragSelection : function(value, old) {
      this._manager.setDrag(value);
    },


    // apply method
    _applyQuickSelection : function(value, old) {
      this._manager.setQuick(value);
    },


    /*
    ---------------------------------------------------------------------------
      SELECTION HANDLERS
    ---------------------------------------------------------------------------
    */


    /**
     * Event handler for the internal selection change {@link #selection}.
     *
     * @param e {qx.event.type.Data} the change event.
     */
    _onChangeSelection : function(e)
    {
      if (this.__ignoreManagerChangeSelection == true) {
        return;
      }

      this.__ignoreChangeSelection = true;
      var selection = this.getSelection();

      var newSelection = [];
      for (var i = 0; i < selection.getLength(); i++)
      {
        var item = selection.getItem(i);
        var selectables = this._getSelectables();
        var index = -1;

        if (selectables != null) {
          index = selectables.indexOf(item);
        }

        var row = this._reverseLookup(index);

        if (row >= 0) {
          newSelection.push(row);
        }
      }

      if (this._beforeApplySelection != null &&
          qx.lang.Type.isFunction(this._beforeApplySelection)) {
        this._beforeApplySelection(newSelection);
      }

      try {
        if (!qx.lang.Array.equals(newSelection, this._manager.getSelection())) {
          this._manager.replaceSelection(newSelection);
        }
      }
      catch(ex)
      {
        this._manager.selectItem(newSelection[newSelection.length - 1]);
      }
      this.__synchronizeSelection();

      if (this._afterApplySelection != null &&
          qx.lang.Type.isFunction(this._afterApplySelection)) {
        this._afterApplySelection();
      }

      this.__ignoreChangeSelection = false;
    },


    /**
     * Event handler for the selection change from the <code>_manager</code>.
     *
     * @param e {qx.event.type.Data} the change event.
     */
    _onManagerChangeSelection : function(e)
    {
      if (this.__ignoreChangeSelection == true) {
        return;
      }

      this.__ignoreManagerChangeSelection = true;

      this.__synchronizeSelection();

      this.__ignoreManagerChangeSelection = false;
    },


    /**
     * Synchronized the selection form the manager with the local one.
     */
    __synchronizeSelection : function()
    {
      if (this.__isSelectionEquals()) {
        return
      }

      var managerSelection = this._manager.getSelection();
      var newSelection = [];

      for (var i = 0; i < managerSelection.length; i++)
      {
        var item = this._getDataFromRow(managerSelection[i]);

        if (item != null) {
          newSelection.push(item);
        }
      }

      this.__replaceSelection(newSelection);
    },


    /**
     * Replace the current selection with the passed selection Array.
     *
     * @param newSelection {qx.data.Array} The new selection.
     */
    __replaceSelection : function(newSelection)
    {
      var selection = this.getSelection();
      if (newSelection.length > 0)
      {
        var args = [0, selection.getLength()];
        args = args.concat(newSelection);
        // dispose data array returned by splice to avoid memory leak
        var temp = selection.splice.apply(selection, args);
        temp.dispose();
      } else {
        selection.removeAll();
      }
    },


    /**
     * Checks whether the local and the manager selection are equal.
     *
     * @return {Boolean} <code>true</code> if the selections are equal,
     *   <code>false</code> otherwise.
     */
    __isSelectionEquals : function()
    {
      var selection = this.getSelection();
      var managerSelection = this._manager.getSelection();

      if (selection.getLength() !== managerSelection.length) {
        return false;
      }

      for (var i = 0; i < selection.getLength(); i++)
      {
        var item = selection.getItem(i);
        var selectables = this._getSelectables()
        var index = -1;

        if (selectables != null) {
          index = selectables.indexOf(item);
        }
        var row = this._reverseLookup(index);

        if (row !== managerSelection[i]) {
          return false;
        };
      }
      return true;
    },


    /**
     * Helper Method to select default item.
     */
    _applyDefaultSelection : function() {
      if (this._manager != null) {
        this._manager._applyDefaultSelection();
      }
    }
  },


  destruct : function()
  {
    this._manager.dispose();
    this._manager = null;
    if (this.__defaultSelection) {
      this.__defaultSelection.dispose();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Generic selection manager to bring rich desktop like selection behavior
 * to widgets and low-level interactive controls.
 *
 * The selection handling supports both Shift and Ctrl/Meta modifies like
 * known from native applications.
 */
qx.Class.define("qx.ui.core.selection.Abstract",
{
  type : "abstract",
  extend : qx.core.Object,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // {Map} Internal selection storage
    this.__selection = {};
  },




  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fires after the selection was modified. Contains the selection under the data property. */
    "changeSelection" : "qx.event.type.Data"
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Selects the selection mode to use.
     *
     * * single: One or no element is selected
     * * multi: Multi items could be selected. Also allows empty selections.
     * * additive: Easy Web-2.0 selection mode. Allows multiple selections without modifier keys.
     * * one: If possible always exactly one item is selected
     */
    mode :
    {
      check : [ "single", "multi", "additive", "one" ],
      init : "single",
      apply : "_applyMode"
    },


    /**
     * Enable drag selection (multi selection of items through
     * dragging the pointer in pressed states).
     *
     * Only possible for the modes <code>multi</code> and <code>additive</code>
     */
    drag :
    {
      check : "Boolean",
      init : false
    },


    /**
     * Enable quick selection mode, where no tap is needed to change the selection.
     *
     * Only possible for the modes <code>single</code> and <code>one</code>.
     */
    quick :
    {
      check : "Boolean",
      init : false
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __scrollStepX : 0,
    __scrollStepY : 0,
    __scrollTimer : null,
    __frameScroll : null,
    __lastRelX : null,
    __lastRelY : null,
    __frameLocation : null,
    __dragStartX : null,
    __dragStartY : null,
    __inCapture : null,
    __pointerX : null,
    __pointerY : null,
    __moveDirectionX : null,
    __moveDirectionY : null,
    __selectionModified : null,
    __selectionContext : null,
    __leadItem : null,
    __selection : null,
    __anchorItem : null,
    __pointerDownOnSelected : null,

    // A flag that signals an user interaction, which means the selection change
    // was triggered by pointer or keyboard [BUG #3344]
    _userInteraction : false,

    __oldScrollTop : null,

    /*
    ---------------------------------------------------------------------------
      USER APIS
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the selection context. One of <code>tap</code>,
     * <code>quick</code>, <code>drag</code> or <code>key</code> or
     * <code>null</code>.
     *
     * @return {String} One of <code>tap</code>, <code>quick</code>,
     *    <code>drag</code> or <code>key</code> or <code>null</code>
     */
    getSelectionContext : function() {
      return this.__selectionContext;
    },


    /**
     * Selects all items of the managed object.
     *
     */
    selectAll : function()
    {
      var mode = this.getMode();
      if (mode == "single" || mode == "one") {
        throw new Error("Can not select all items in selection mode: " + mode);
      }

      this._selectAllItems();
      this._fireChange();
    },


    /**
     * Selects the given item. Replaces current selection
     * completely with the new item.
     *
     * Use {@link #addItem} instead if you want to add new
     * items to an existing selection.
     *
     * @param item {Object} Any valid item
     */
    selectItem : function(item)
    {
      this._setSelectedItem(item);

      var mode = this.getMode();
      if (mode !== "single" && mode !== "one")
      {
        this._setLeadItem(item);
        this._setAnchorItem(item);
      }

      this._scrollItemIntoView(item);
      this._fireChange();
    },


    /**
     * Adds the given item to the existing selection.
     *
     * Use {@link #selectItem} instead if you want to replace
     * the current selection.
     *
     * @param item {Object} Any valid item
     */
    addItem : function(item)
    {
      var mode = this.getMode();
      if (mode === "single" || mode === "one") {
        this._setSelectedItem(item);
      }
      else
      {
        if (this._getAnchorItem() == null) {
          this._setAnchorItem(item);
        }

        this._setLeadItem(item);
        this._addToSelection(item);
      }

      this._scrollItemIntoView(item);
      this._fireChange();
    },


    /**
     * Removes the given item from the selection.
     *
     * Use {@link #clearSelection} when you want to clear
     * the whole selection at once.
     *
     * @param item {Object} Any valid item
     */
    removeItem : function(item)
    {
      this._removeFromSelection(item);

      if (this.getMode() === "one" && this.isSelectionEmpty())
      {
        var selected = this._applyDefaultSelection();

        // Do not fire any event in this case.
        if (selected == item) {
          return;
        }
      }

      if (this.getLeadItem() == item) {
        this._setLeadItem(null);
      }

      if (this._getAnchorItem() == item) {
        this._setAnchorItem(null);
      }

      this._fireChange();
    },


    /**
     * Selects an item range between two given items.
     *
     * @param begin {Object} Item to start with
     * @param end {Object} Item to end at
     */
    selectItemRange : function(begin, end)
    {
      var mode = this.getMode();
      if (mode == "single" || mode == "one") {
        throw new Error("Can not select multiple items in selection mode: " + mode);
      }

      this._selectItemRange(begin, end);

      this._setAnchorItem(begin);

      this._setLeadItem(end);
      this._scrollItemIntoView(end);

      this._fireChange();
    },


    /**
     * Clears the whole selection at once. Also
     * resets the lead and anchor items and their
     * styles.
     *
     */
    clearSelection : function()
    {
      if (this.getMode() == "one")
      {
        var selected = this._applyDefaultSelection(true);
        if (selected != null) {
          return;
        }
      }

      this._clearSelection();
      this._setLeadItem(null);
      this._setAnchorItem(null);

      this._fireChange();
    },


    /**
     * Replaces current selection with given array of items.
     *
     * Please note that in single selection scenarios it is more
     * efficient to directly use {@link #selectItem}.
     *
     * @param items {Array} Items to select
     */
    replaceSelection : function(items)
    {
      var mode = this.getMode();
      if (mode == "one" || mode === "single")
      {
        if (items.length > 1)   {
          throw new Error("Could not select more than one items in mode: " + mode + "!");
        }

        if (items.length == 1) {
          this.selectItem(items[0]);
        } else {
          this.clearSelection();
        }
        return;
      }
      else
      {
        this._replaceMultiSelection(items);
      }
    },


    /**
     * Get the selected item. This method does only work in <code>single</code>
     * selection mode.
     *
     * @return {Object} The selected item.
     */
    getSelectedItem : function()
    {
      var mode = this.getMode();
      if (mode === "single" || mode === "one")
      {
        var result = this._getSelectedItem();
        return result != undefined ? result : null;
      }

      throw new Error("The method getSelectedItem() is only supported in 'single' and 'one' selection mode!");
    },


    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {Object[]} List of items.
     */
    getSelection : function() {
      return qx.lang.Object.getValues(this.__selection);
    },


    /**
     * Returns the selection sorted by the index in the
     * container of the selection (the assigned widget)
     *
     * @return {Object[]} Sorted list of items
     */
    getSortedSelection : function()
    {
      var children = this.getSelectables();
      var sel = qx.lang.Object.getValues(this.__selection);

      sel.sort(function(a, b) {
        return children.indexOf(a) - children.indexOf(b);
      });

      return sel;
    },


    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {var} Any valid selectable item
     * @return {Boolean} Whether the item is selected
     */
    isItemSelected : function(item)
    {
      var hash = this._selectableToHashCode(item);
      return this.__selection[hash] !== undefined;
    },


    /**
     * Whether the selection is empty
     *
     * @return {Boolean} Whether the selection is empty
     */
    isSelectionEmpty : function() {
      return qx.lang.Object.isEmpty(this.__selection);
    },


    /**
     * Invert the selection. Select the non selected and deselect the selected.
     */
    invertSelection: function() {
      var mode = this.getMode();
      if (mode === "single" || mode === "one") {
        throw new Error("The method invertSelection() is only supported in 'multi' and 'additive' selection mode!");
      }

      var selectables = this.getSelectables();
      for (var i = 0; i < selectables.length; i++)
      {
        this._toggleInSelection(selectables[i]);
      }

      this._fireChange();
    },



    /*
    ---------------------------------------------------------------------------
      LEAD/ANCHOR SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the lead item. Generally the item which was last modified
     * by the user (tapped on etc.)
     *
     * @param value {Object} Any valid item or <code>null</code>
     */
    _setLeadItem : function(value)
    {
      var old = this.__leadItem;

      if (old !== null) {
        this._styleSelectable(old, "lead", false);
      }

      if (value !== null) {
        this._styleSelectable(value, "lead", true);
      }

      this.__leadItem = value;
    },


    /**
     * Returns the current lead item. Generally the item which was last modified
     * by the user (tapped on etc.)
     *
     * @return {Object} The lead item or <code>null</code>
     */
    getLeadItem : function() {
      return this.__leadItem;
    },


    /**
     * Sets the anchor item. This is the item which is the starting
     * point for all range selections. Normally this is the item which was
     * tapped on the last time without any modifier keys pressed.
     *
     * @param value {Object} Any valid item or <code>null</code>
     */
    _setAnchorItem : function(value)
    {
      var old = this.__anchorItem;

      if (old != null) {
        this._styleSelectable(old, "anchor", false);
      }

      if (value != null) {
        this._styleSelectable(value, "anchor", true);
      }

      this.__anchorItem = value;
    },


    /**
     * Returns the current anchor item. This is the item which is the starting
     * point for all range selections. Normally this is the item which was
     * tapped on the last time without any modifier keys pressed.
     *
     * @return {Object} The anchor item or <code>null</code>
     */
    _getAnchorItem : function() {
      return this.__anchorItem !== null ? this.__anchorItem : null;
    },





    /*
    ---------------------------------------------------------------------------
      BASIC SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Whether the given item is selectable.
     *
     * @param item {var} Any item
     * @return {Boolean} <code>true</code> when the item is selectable
     */
    _isSelectable : function(item) {
      throw new Error("Abstract method call: _isSelectable()");
    },


    /**
     * Finds the selectable instance from a pointer event
     *
     * @param event {qx.event.type.Pointer} The pointer event
     * @return {Object|null} The resulting selectable
     */
    _getSelectableFromPointerEvent : function(event)
    {
      var target = event.getTarget();
      // check for target (may be null when leaving the viewport) [BUG #4378]
      if (target && this._isSelectable(target)) {
        return target;
      }
      return null;
    },


    /**
     * Returns an unique hashcode for the given item.
     *
     * @param item {var} Any item
     * @return {String} A valid hashcode
     */
    _selectableToHashCode : function(item) {
      throw new Error("Abstract method call: _selectableToHashCode()");
    },


    /**
     * Updates the style (appearance) of the given item.
     *
     * @param item {var} Item to modify
     * @param type {String} Any of <code>selected</code>, <code>anchor</code> or <code>lead</code>
     * @param enabled {Boolean} Whether the given style should be added or removed.
     */
    _styleSelectable : function(item, type, enabled) {
      throw new Error("Abstract method call: _styleSelectable()");
    },


    /**
     * Enables capturing of the container.
     *
     */
    _capture : function() {
      throw new Error("Abstract method call: _capture()");
    },


    /**
     * Releases capturing of the container
     *
     */
    _releaseCapture : function() {
      throw new Error("Abstract method call: _releaseCapture()");
    },






    /*
    ---------------------------------------------------------------------------
      DIMENSION AND LOCATION
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the location of the container
     *
     * @return {Map} Map with the keys <code>top</code>, <code>right</code>,
     *    <code>bottom</code> and <code>left</code>.
     */
    _getLocation : function() {
      throw new Error("Abstract method call: _getLocation()");
    },


    /**
     * Returns the dimension of the container (available scrolling space).
     *
     * @return {Map} Map with the keys <code>width</code> and <code>height</code>.
     */
    _getDimension : function() {
      throw new Error("Abstract method call: _getDimension()");
    },


    /**
     * Returns the relative (to the container) horizontal location of the given item.
     *
     * @param item {var} Any item
     * @return {Map} A map with the keys <code>left</code> and <code>right</code>.
     */
    _getSelectableLocationX : function(item) {
      throw new Error("Abstract method call: _getSelectableLocationX()");
    },


    /**
     * Returns the relative (to the container) horizontal location of the given item.
     *
     * @param item {var} Any item
     * @return {Map} A map with the keys <code>top</code> and <code>bottom</code>.
     */
    _getSelectableLocationY : function(item) {
      throw new Error("Abstract method call: _getSelectableLocationY()");
    },






    /*
    ---------------------------------------------------------------------------
      SCROLL SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the scroll position of the container.
     *
     * @return {Map} Map with the keys <code>left</code> and <code>top</code>.
     */
    _getScroll : function() {
      throw new Error("Abstract method call: _getScroll()");
    },


    /**
     * Scrolls by the given offset
     *
     * @param xoff {Integer} Horizontal offset to scroll by
     * @param yoff {Integer} Vertical offset to scroll by
     */
    _scrollBy : function(xoff, yoff) {
      throw new Error("Abstract method call: _scrollBy()");
    },


    /**
     * Scrolls the given item into the view (make it visible)
     *
     * @param item {var} Any item
     */
    _scrollItemIntoView : function(item) {
      throw new Error("Abstract method call: _scrollItemIntoView()");
    },






    /*
    ---------------------------------------------------------------------------
      QUERY SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns all selectable items of the container.
     *
     * @param all {Boolean} true for all selectables, false for the
      *   selectables the user can interactively select
     * @return {Array} A list of items
     */
    getSelectables : function(all) {
      throw new Error("Abstract method call: getSelectables()");
    },


    /**
     * Returns all selectable items between the two given items.
     *
     * The items could be given in any order.
     *
     * @param item1 {var} First item
     * @param item2 {var} Second item
     * @return {Array} List of items
     */
    _getSelectableRange : function(item1, item2) {
      throw new Error("Abstract method call: _getSelectableRange()");
    },


    /**
     * Returns the first selectable item.
     *
     * @return {var} The first selectable item
     */
    _getFirstSelectable : function() {
      throw new Error("Abstract method call: _getFirstSelectable()");
    },


    /**
     * Returns the last selectable item.
     *
     * @return {var} The last selectable item
     */
    _getLastSelectable : function() {
      throw new Error("Abstract method call: _getLastSelectable()");
    },


    /**
     * Returns a selectable item which is related to the given
     * <code>item</code> through the value of <code>relation</code>.
     *
     * @param item {var} Any item
     * @param relation {String} A valid relation: <code>above</code>,
     *    <code>right</code>, <code>under</code> or <code>left</code>
     * @return {var} The related item
     */
    _getRelatedSelectable : function(item, relation) {
      throw new Error("Abstract method call: _getRelatedSelectable()");
    },


    /**
     * Returns the item which should be selected on pageUp/pageDown.
     *
     * May also scroll to the needed position.
     *
     * @param lead {var} The current lead item
     * @param up {Boolean?false} Which page key was pressed:
     *   <code>up</code> or <code>down</code>.
     */
    _getPage : function(lead, up) {
      throw new Error("Abstract method call: _getPage()");
    },




    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyMode : function(value, old)
    {
      this._setLeadItem(null);
      this._setAnchorItem(null);

      this._clearSelection();

      // Mode "one" requires one selected item
      if (value === "one") {
        this._applyDefaultSelection(true);
      }

      this._fireChange();
    },






    /*
    ---------------------------------------------------------------------------
      POINTER SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * This method should be connected to the <code>pointerover</code> event
     * of the managed object.
     *
     * @param event {qx.event.type.Pointer} A valid pointer event
     */
    handlePointerOver : function(event)
    {
      // All browsers (except Opera) fire a native "mouseover" event when a scroll appears
      // by keyboard interaction. We have to ignore the event to avoid a selection for
      // "pointerover" (quick selection). For more details see [BUG #4225]
      if(this.__oldScrollTop != null &&
         this.__oldScrollTop != this._getScroll().top)
      {
        this.__oldScrollTop = null;
        return;
      }

      // quick select should only work on mouse events
      if (event.getPointerType() != "mouse") {
        return;
      }

      // this is a method invoked by an user interaction, so be careful to
      // set / clear the mark this._userInteraction [BUG #3344]
      this._userInteraction = true;

      if (!this.getQuick()) {
        this._userInteraction = false;
        return;
      }

      var mode = this.getMode();
      if (mode !== "one" && mode !== "single") {
        this._userInteraction = false;
        return;
      }

      var item = this._getSelectableFromPointerEvent(event);
      if (item === null) {
        this._userInteraction = false;
        return;
      }

      this._setSelectedItem(item);

      // Be sure that item is in view
      // This does not feel good when pointerover is used
      // this._scrollItemIntoView(item);

      // Fire change event as needed
      this._fireChange("quick");

      this._userInteraction = false;
    },


    /**
     * This method should be connected to the <code>pointerdown</code> event
     * of the managed object.
     *
     * @param event {qx.event.type.Pointer} A valid pointer event
     */
    handlePointerDown : function(event)
    {
      // this is a method invoked by an user interaction, so be careful to
      // set / clear the mark this._userInteraction [BUG #3344]
      this._userInteraction = true;

      var item = this._getSelectableFromPointerEvent(event);
      if (item === null) {
        this._userInteraction = false;
        return;
      }

      // Read in keyboard modifiers
      var isCtrlPressed = event.isCtrlPressed() ||
        (qx.core.Environment.get("os.name") == "osx" && event.isMetaPressed());
      var isShiftPressed = event.isShiftPressed();

      // tapping on selected items deselect on pointerup, not on pointerdown
      if (this.isItemSelected(item) && !isShiftPressed && !isCtrlPressed && !this.getDrag())
      {
        this.__pointerDownOnSelected = item;
        this._userInteraction = false;
        return;
      }
      else
      {
        this.__pointerDownOnSelected = null;
      }

      // Be sure that item is in view
      this._scrollItemIntoView(item);

      // Drag selection
      var mode = this.getMode();
      if (
        this.getDrag() &&
        mode !== "single" &&
        mode !== "one" &&
        !isShiftPressed &&
        !isCtrlPressed &&
        event.getPointerType() == "mouse"
      )
      {
        this._setAnchorItem(item);
        this._setLeadItem(item);

        // Cache location/scroll data
        this.__frameLocation = this._getLocation();
        this.__frameScroll = this._getScroll();

        // Store position at start
        this.__dragStartX = event.getDocumentLeft() + this.__frameScroll.left;
        this.__dragStartY = event.getDocumentTop() + this.__frameScroll.top;

        // Switch to capture mode
        this.__inCapture = true;
        this._capture();
      }


      // Fire change event as needed
      this._fireChange("tap");

      this._userInteraction = false;
    },


    /**
     * This method should be connected to the <code>tap</code> event
     * of the managed object.
     *
     * @param event {qx.event.type.Tap} A valid pointer event
     */
    handleTap : function(event)
    {
      // this is a method invoked by an user interaction, so be careful to
      // set / clear the mark this._userInteraction [BUG #3344]
      this._userInteraction = true;

      // Read in keyboard modifiers
      var isCtrlPressed = event.isCtrlPressed() ||
        (qx.core.Environment.get("os.name") == "osx" && event.isMetaPressed());
      var isShiftPressed = event.isShiftPressed();

      if (!isCtrlPressed && !isShiftPressed && this.__pointerDownOnSelected != null)
      {
        this._userInteraction = false;
        var item = this._getSelectableFromPointerEvent(event);
        if (item === null || !this.isItemSelected(item)) {
          return;
        }
      }

      var item = this._getSelectableFromPointerEvent(event);
      if (item === null) {
        this._userInteraction = false;
        return;
      }

      // Action depends on selected mode
      switch(this.getMode())
      {
        case "single":
        case "one":
          this._setSelectedItem(item);
          break;

        case "additive":
          this._setLeadItem(item);
          this._setAnchorItem(item);
          this._toggleInSelection(item);
          break;

        case "multi":
          // Update lead item
          this._setLeadItem(item);

          // Create/Update range selection
          if (isShiftPressed)
          {
            var anchor = this._getAnchorItem();
            if (anchor === null)
            {
              anchor = this._getFirstSelectable();
              this._setAnchorItem(anchor);
            }

            this._selectItemRange(anchor, item, isCtrlPressed);
          }

          // Toggle in selection
          else if (isCtrlPressed)
          {
            this._setAnchorItem(item);
            this._toggleInSelection(item);
          }

          // Replace current selection
          else
          {
            this._setAnchorItem(item);
            this._setSelectedItem(item);
          }

          break;
      }

      // Cleanup operation
      this._cleanup();
    },


    /**
     * This method should be connected to the <code>losecapture</code> event
     * of the managed object.
     *
     * @param event {qx.event.type.Pointer} A valid pointer event
     */
    handleLoseCapture : function(event) {
      this._cleanup();
    },


    /**
     * This method should be connected to the <code>pointermove</code> event
     * of the managed object.
     *
     * @param event {qx.event.type.Pointer} A valid pointer event
     */
    handlePointerMove : function(event)
    {
      // Only relevant when capturing is enabled
      if (!this.__inCapture) {
        return;
      }


      // Update pointer position cache
      this.__pointerX = event.getDocumentLeft();
      this.__pointerY = event.getDocumentTop();

      // this is a method invoked by an user interaction, so be careful to
      // set / clear the mark this._userInteraction [BUG #3344]
      this._userInteraction = true;

      // Detect move directions
      var dragX = this.__pointerX + this.__frameScroll.left;
      if (dragX > this.__dragStartX) {
        this.__moveDirectionX = 1;
      } else if (dragX < this.__dragStartX) {
        this.__moveDirectionX = -1;
      } else {
        this.__moveDirectionX = 0;
      }

      var dragY = this.__pointerY + this.__frameScroll.top;
      if (dragY > this.__dragStartY) {
        this.__moveDirectionY = 1;
      } else if (dragY < this.__dragStartY) {
        this.__moveDirectionY = -1;
      } else {
        this.__moveDirectionY = 0;
      }


      // Update scroll steps
      var location = this.__frameLocation;

      if (this.__pointerX < location.left) {
        this.__scrollStepX = this.__pointerX - location.left;
      } else if (this.__pointerX > location.right) {
        this.__scrollStepX = this.__pointerX - location.right;
      } else {
        this.__scrollStepX = 0;
      }

      if (this.__pointerY < location.top) {
        this.__scrollStepY = this.__pointerY - location.top;
      } else if (this.__pointerY > location.bottom) {
        this.__scrollStepY = this.__pointerY - location.bottom;
      } else {
        this.__scrollStepY = 0;
      }


      // Dynamically create required timer instance
      if (!this.__scrollTimer)
      {
        this.__scrollTimer = new qx.event.Timer(100);
        this.__scrollTimer.addListener("interval", this._onInterval, this);
      }


      // Start interval
      this.__scrollTimer.start();


      // Auto select based on new cursor position
      this._autoSelect();

      event.stopPropagation();
      this._userInteraction = false;
    },


    /**
     * This method should be connected to the <code>addItem</code> event
     * of the managed object.
     *
     * @param e {qx.event.type.Data} The event object
     */
    handleAddItem : function(e)
    {
      var item = e.getData();
      if (this.getMode() === "one" && this.isSelectionEmpty()) {
        this.addItem(item);
      }
    },


    /**
     * This method should be connected to the <code>removeItem</code> event
     * of the managed object.
     *
     * @param e {qx.event.type.Data} The event object
     */
    handleRemoveItem : function(e) {
      this.removeItem(e.getData());
    },




    /*
    ---------------------------------------------------------------------------
      POINTER SUPPORT INTERNALS
    ---------------------------------------------------------------------------
    */

    /**
     * Stops all timers, release capture etc. to cleanup drag selection
     */
    _cleanup : function()
    {
      if (!this.getDrag() && this.__inCapture) {
        return;
      }

      // Fire change event if needed
      if (this.__selectionModified) {
        this._fireChange("tap");
      }

      // Remove flags
      delete this.__inCapture;
      delete this.__lastRelX;
      delete this.__lastRelY;

      // Stop capturing
      this._releaseCapture();

      // Stop timer
      if (this.__scrollTimer) {
        this.__scrollTimer.stop();
      }
    },


    /**
     * Event listener for timer used by drag selection
     *
     * @param e {qx.event.type.Event} Timer event
     */
    _onInterval : function(e)
    {
      // Scroll by defined block size
      this._scrollBy(this.__scrollStepX, this.__scrollStepY);

      // Update scroll cache
      this.__frameScroll = this._getScroll();

      // Auto select based on new scroll position and cursor
      this._autoSelect();
    },


    /**
     * Automatically selects items based on the pointer movement during a drag selection
     */
    _autoSelect : function()
    {
      var inner = this._getDimension();

      // Get current relative Y position and compare it with previous one
      var relX = Math.max(0, Math.min(this.__pointerX - this.__frameLocation.left, inner.width)) + this.__frameScroll.left;
      var relY = Math.max(0, Math.min(this.__pointerY - this.__frameLocation.top, inner.height)) + this.__frameScroll.top;

      // Compare old and new relative coordinates (for performance reasons)
      if (this.__lastRelX === relX && this.__lastRelY === relY) {
        return;
      }
      this.__lastRelX = relX;
      this.__lastRelY = relY;

      // Cache anchor
      var anchor = this._getAnchorItem();
      var lead = anchor;


      // Process X-coordinate
      var moveX = this.__moveDirectionX;
      var nextX, locationX;

      while (moveX !== 0)
      {
        // Find next item to process depending on current scroll direction
        nextX = moveX > 0 ?
          this._getRelatedSelectable(lead, "right") :
          this._getRelatedSelectable(lead, "left");

        // May be null (e.g. first/last item)
        if (nextX !== null)
        {
          locationX = this._getSelectableLocationX(nextX);

          // Continue when the item is in the visible area
          if (
            (moveX > 0 && locationX.left <= relX) ||
            (moveX < 0 && locationX.right >= relX)
          )
          {
            lead = nextX;
            continue;
          }
        }

        // Otherwise break
        break;
      }


      // Process Y-coordinate
      var moveY = this.__moveDirectionY;
      var nextY, locationY;

      while (moveY !== 0)
      {
        // Find next item to process depending on current scroll direction
        nextY = moveY > 0 ?
          this._getRelatedSelectable(lead, "under") :
          this._getRelatedSelectable(lead, "above");

        // May be null (e.g. first/last item)
        if (nextY !== null)
        {
          locationY = this._getSelectableLocationY(nextY);

          // Continue when the item is in the visible area
          if (
            (moveY > 0 && locationY.top <= relY) ||
            (moveY < 0 && locationY.bottom >= relY)
          )
          {
            lead = nextY;
            continue;
          }
        }

        // Otherwise break
        break;
      }


      // Differenciate between the two supported modes
      var mode = this.getMode();
      if (mode === "multi")
      {
        // Replace current selection with new range
        this._selectItemRange(anchor, lead);
      }
      else if (mode === "additive")
      {
        // Behavior depends on the fact whether the
        // anchor item is selected or not
        if (this.isItemSelected(anchor)) {
          this._selectItemRange(anchor, lead, true);
        } else {
          this._deselectItemRange(anchor, lead);
        }

        // Improve performance. This mode does not rely
        // on full ranges as it always extend the old
        // selection/deselection.
        this._setAnchorItem(lead);
      }


      // Fire change event as needed
      this._fireChange("drag");
    },






    /*
    ---------------------------------------------------------------------------
      KEYBOARD SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Map} All supported navigation keys
     *
     * @lint ignoreReferenceField(__navigationKeys)
     */
    __navigationKeys :
    {
      Home : 1,
      Down : 1 ,
      Right : 1,
      PageDown : 1,
      End : 1,
      Up : 1,
      Left : 1,
      PageUp : 1
    },


    /**
     * This method should be connected to the <code>keypress</code> event
     * of the managed object.
     *
     * @param event {qx.event.type.KeySequence} A valid key sequence event
     */
    handleKeyPress : function(event)
    {
      // this is a method invoked by an user interaction, so be careful to
      // set / clear the mark this._userInteraction [BUG #3344]
      this._userInteraction = true;

      var current, next;
      var key = event.getKeyIdentifier();
      var mode = this.getMode();

      // Support both control keys on Mac
      var isCtrlPressed = event.isCtrlPressed() ||
        (qx.core.Environment.get("os.name") == "osx" && event.isMetaPressed());
      var isShiftPressed = event.isShiftPressed();

      var consumed = false;

      if (key === "A" && isCtrlPressed)
      {
        if (mode !== "single" && mode !== "one")
        {
          this._selectAllItems();
          consumed = true;
        }
      }
      else if (key === "Escape")
      {
        if (mode !== "single" && mode !== "one")
        {
          this._clearSelection();
          consumed = true;
        }
      }
      else if (key === "Space")
      {
        var lead = this.getLeadItem();
        if (lead != null && !isShiftPressed)
        {
          if (isCtrlPressed || mode === "additive") {
            this._toggleInSelection(lead);
          } else {
            this._setSelectedItem(lead);
          }
          consumed = true;
        }
      }
      else if (this.__navigationKeys[key])
      {
        consumed = true;
        if (mode === "single" || mode == "one") {
          current = this._getSelectedItem();
        } else {
          current = this.getLeadItem();
        }

        if (current !== null)
        {
          switch(key)
          {
            case "Home":
              next = this._getFirstSelectable();
              break;

            case "End":
              next = this._getLastSelectable();
              break;

            case "Up":
              next = this._getRelatedSelectable(current, "above");
              break;

            case "Down":
              next = this._getRelatedSelectable(current, "under");
              break;

            case "Left":
              next = this._getRelatedSelectable(current, "left");
              break;

            case "Right":
              next = this._getRelatedSelectable(current, "right");
              break;

            case "PageUp":
              next = this._getPage(current, true);
              break;

            case "PageDown":
              next = this._getPage(current, false);
              break;
          }
        }
        else
        {
          switch(key)
          {
            case "Home":
            case "Down":
            case "Right":
            case "PageDown":
              next = this._getFirstSelectable();
              break;

            case "End":
            case "Up":
            case "Left":
            case "PageUp":
              next = this._getLastSelectable();
              break;
          }
        }

        // Process result
        if (next !== null)
        {
          switch(mode)
          {
            case "single":
            case "one":
              this._setSelectedItem(next);
              break;

            case "additive":
              this._setLeadItem(next);
              break;

            case "multi":
              if (isShiftPressed)
              {
                var anchor = this._getAnchorItem();
                if (anchor === null) {
                  this._setAnchorItem(anchor = this._getFirstSelectable());
                }

                this._setLeadItem(next);
                this._selectItemRange(anchor, next, isCtrlPressed);
              }
              else
              {
                this._setAnchorItem(next);
                this._setLeadItem(next);

                if (!isCtrlPressed) {
                  this._setSelectedItem(next);
                }
              }

              break;
          }

          this.__oldScrollTop = this._getScroll().top;
          this._scrollItemIntoView(next);
        }
      }


      if (consumed)
      {
        // Stop processed events
        event.stop();

        // Fire change event as needed
        this._fireChange("key");
      }
      this._userInteraction = false;
    },






    /*
    ---------------------------------------------------------------------------
      SUPPORT FOR ITEM RANGES
    ---------------------------------------------------------------------------
    */

    /**
     * Adds all items to the selection
     */
    _selectAllItems : function()
    {
      var range = this.getSelectables();
      for (var i=0, l=range.length; i<l; i++) {
        this._addToSelection(range[i]);
      }
    },


    /**
     * Clears current selection
     */
    _clearSelection : function()
    {
      var selection = this.__selection;
      for (var hash in selection) {
        this._removeFromSelection(selection[hash]);
      }
      this.__selection = {};
    },


    /**
     * Select a range from <code>item1</code> to <code>item2</code>.
     *
     * @param item1 {Object} Start with this item
     * @param item2 {Object} End with this item
     * @param extend {Boolean?false} Whether the current
     *    selection should be replaced or extended.
     */
    _selectItemRange : function(item1, item2, extend)
    {
      var range = this._getSelectableRange(item1, item2);

      // Remove items which are not in the detected range
      if (!extend)
      {
        var selected = this.__selection;
        var mapped = this.__rangeToMap(range);

        for (var hash in selected)
        {
          if (!mapped[hash]) {
            this._removeFromSelection(selected[hash]);
          }
        }
      }

      // Add new items to the selection
      for (var i=0, l=range.length; i<l; i++) {
        this._addToSelection(range[i]);
      }
    },


    /**
     * Deselect all items between <code>item1</code> and <code>item2</code>.
     *
     * @param item1 {Object} Start with this item
     * @param item2 {Object} End with this item
     */
    _deselectItemRange : function(item1, item2)
    {
      var range = this._getSelectableRange(item1, item2);
      for (var i=0, l=range.length; i<l; i++) {
        this._removeFromSelection(range[i]);
      }
    },


    /**
     * Internal method to convert a range to a map of hash
     * codes for faster lookup during selection compare routines.
     *
     * @param range {Array} List of selectable items
     */
    __rangeToMap : function(range)
    {
      var mapped = {};
      var item;

      for (var i=0, l=range.length; i<l; i++)
      {
        item = range[i];
        mapped[this._selectableToHashCode(item)] = item;
      }

      return mapped;
    },






    /*
    ---------------------------------------------------------------------------
      SINGLE ITEM QUERY AND MODIFICATION
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the first selected item. Only makes sense
     * when using manager in single selection mode.
     *
     * @return {var} The selected item (or <code>null</code>)
     */
    _getSelectedItem : function()
    {
      for (var hash in this.__selection) {
        return this.__selection[hash];
      }

      return null;
    },


    /**
     * Replace current selection with given item.
     *
     * @param item {var} Any valid selectable item
     */
    _setSelectedItem : function(item)
    {
      if (this._isSelectable(item))
      {
        // If already selected try to find out if this is the only item
        var current = this.__selection;
        var hash = this._selectableToHashCode(item);

        if (!current[hash] || (current.length >= 2))
        {
          this._clearSelection();
          this._addToSelection(item);
        }
      }
    },







    /*
    ---------------------------------------------------------------------------
      MODIFY ITEM SELECTION
    ---------------------------------------------------------------------------
    */

    /**
     * Adds an item to the current selection.
     *
     * @param item {Object} Any item
     */
    _addToSelection : function(item)
    {
      var hash = this._selectableToHashCode(item);

      if (this.__selection[hash] == null && this._isSelectable(item))
      {
        this.__selection[hash] = item;
        this._styleSelectable(item, "selected", true);

        this.__selectionModified = true;
      }
    },


    /**
     * Toggles the item e.g. remove it when already selected
     * or select it when currently not.
     *
     * @param item {Object} Any item
     */
    _toggleInSelection : function(item)
    {
      var hash = this._selectableToHashCode(item);

      if (this.__selection[hash] == null)
      {
        this.__selection[hash] = item;
        this._styleSelectable(item, "selected", true);
      }
      else
      {
        delete this.__selection[hash];
        this._styleSelectable(item, "selected", false);
      }

      this.__selectionModified = true;
    },


    /**
     * Removes the given item from the current selection.
     *
     * @param item {Object} Any item
     */
    _removeFromSelection : function(item)
    {
      var hash = this._selectableToHashCode(item);

      if (this.__selection[hash] != null)
      {
        delete this.__selection[hash];
        this._styleSelectable(item, "selected", false);

        this.__selectionModified = true;
      }
    },


    /**
     * Replaces current selection with items from given array.
     *
     * @param items {Array} List of items to select
     */
    _replaceMultiSelection : function(items)
    {
      if (items.length === 0) {
        this.clearSelection();
        return;
      }

      var modified = false;

      // Build map from hash codes and filter non-selectables
      var selectable, hash;
      var incoming = {};
      for (var i=0, l=items.length; i<l; i++)
      {
        selectable = items[i];
        if (this._isSelectable(selectable))
        {
          hash = this._selectableToHashCode(selectable);
          incoming[hash] = selectable;
        }
      }

      // Remember last
      var first = items[0];
      var last = selectable;

      // Clear old entries from map
      var current = this.__selection;
      for (var hash in current)
      {
        if (incoming[hash])
        {
          // Reduce map to make next loop faster
          delete incoming[hash];
        }
        else
        {
          // update internal map
          selectable = current[hash];
          delete current[hash];

          // apply styling
          this._styleSelectable(selectable, "selected", false);

          // remember that the selection has been modified
          modified = true;
        }
      }

      // Add remaining selectables to selection
      for (var hash in incoming)
      {
        // update internal map
        selectable = current[hash] = incoming[hash];

        // apply styling
        this._styleSelectable(selectable, "selected", true);

        // remember that the selection has been modified
        modified = true;
      }

      // Do not do anything if selection is equal to previous one
      if (!modified) {
        return false;
      }

      // Scroll last incoming item into view
      this._scrollItemIntoView(last);

      // Reset anchor and lead item
      this._setLeadItem(first);
      this._setAnchorItem(first);

      // Finally fire change event
      this.__selectionModified = true;
      this._fireChange();
    },


    /**
     * Fires the selection change event if the selection has
     * been modified.
     *
     * @param context {String} One of <code>tap</code>, <code>quick</code>,
     *    <code>drag</code> or <code>key</code> or <code>null</code>
     */
    _fireChange : function(context)
    {
      if (this.__selectionModified)
      {
        // Store context
        this.__selectionContext = context || null;

        // Fire data event which contains the current selection
        this.fireDataEvent("changeSelection", this.getSelection());
        delete this.__selectionModified;
      }
    },


    /**
     * Applies the default selection. The default item is the first item.
     *
     * @param force {Boolean} Whether the default selection sould forced.
     *
     * @return {var} The selected item.
     */
    _applyDefaultSelection : function(force)
    {
      if (force === true || this.getMode() === "one" && this.isSelectionEmpty())
      {
        var first = this._getFirstSelectable();
        if (first != null) {
          this.selectItem(first);
        }
        return first;
      }
      return null;
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._disposeObjects("__scrollTimer");
    this.__selection = this.__pointerDownOnSelected = this.__anchorItem = null;
    this.__leadItem = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * Abstract base class for selection manager, which manage selectable items
 * rendered in a virtual {@link qx.ui.virtual.core.Pane}.
 */
qx.Class.define("qx.ui.virtual.selection.Abstract",
{
  extend : qx.ui.core.selection.Abstract,


  /*
   *****************************************************************************
      CONSTRUCTOR
   *****************************************************************************
   */

  /**
   * @param pane {qx.ui.virtual.core.Pane} The virtual pane on which the
   *    selectable item are rendered
   * @param selectionDelegate {ISelectionDelegate?null} An optional delegate,
   *    which can be used to customize the behavior of the selection manager
   *    without sub classing it.
   */
  construct : function(pane, selectionDelegate)
  {
    this.base(arguments);

    if (qx.core.Environment.get("qx.debug")) {
      this.assertInstance(pane, qx.ui.virtual.core.Pane);
    }

    this._pane = pane;
    this._delegate = selectionDelegate || {};
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      DELEGATE METHODS
    ---------------------------------------------------------------------------
    */

    // overridden
    _isSelectable : function(item) {
      return this._delegate.isItemSelectable ?
        this._delegate.isItemSelectable(item) :
        true;
    },


    // overridden
    _styleSelectable : function(item, type, enabled)
    {
      if (this._delegate.styleSelectable) {
        this._delegate.styleSelectable(item, type, enabled);
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENTS
    ---------------------------------------------------------------------------
    */

    /**
     * Attach pointer events to the managed pane.
     */
    attachPointerEvents : function()
    {
      var paneElement = this._pane.getContentElement();
      paneElement.addListener("pointerdown", this.handlePointerDown, this);
      paneElement.addListener("tap", this.handleTap, this);
      paneElement.addListener("pointerover", this.handlePointerOver, this);
      paneElement.addListener("pointermove", this.handlePointerMove, this);
      paneElement.addListener("losecapture", this.handleLoseCapture, this);
    },


    /**
     * Detach pointer events from the managed pane.
     */
    detatchPointerEvents : function()
    {
      var paneElement = this._pane.getContentElement();
      paneElement.removeListener("pointerdown", this.handlePointerDown, this);
      paneElement.removeListener("tap", this.handleTap, this);
      paneElement.removeListener("pointerover", this.handlePointerOver, this);
      paneElement.removeListener("pointermove", this.handlePointerMove, this);
      paneElement.removeListener("losecapture", this.handleLoseCapture, this);
    },


    /**
     * Attach key events to manipulate the selection using the keyboard. The
     * event target doesn't need to be the pane itself. It can be an widget,
     * which received key events. Usually the key event target is the
     * {@link qx.ui.virtual.core.Scroller}.
     *
     * @param target {qx.core.Object} the key event target.
     *
     */
    attachKeyEvents : function(target) {
      target.addListener("keypress", this.handleKeyPress, this);
    },


    /**
     * Detach key events.
     *
     * @param target {qx.core.Object} the key event target.
     */
    detachKeyEvents : function(target) {
      target.removeListener("keypress", this.handleKeyPress, this);
    },


    /**
     * Attach list events. The selection mode <code>one</code> need to know,
     * when selectable items are added or removed. If this mode is used the
     * <code>list</code> parameter must fire <code>addItem</code> and
     * <code>removeItem</code> events.
     *
     * @param list {qx.core.Object} the event target for <code>addItem</code> and
     *    <code>removeItem</code> events
     */
    attachListEvents : function(list)
    {
      list.addListener("addItem", this.handleAddItem, this);
      list.addListener("removeItem", this.handleRemoveItem, this);
    },


    /**
     * Detach list events.
     *
     * @param list {qx.core.Object} the event target for <code>addItem</code> and
     *    <code>removeItem</code> events
     */
    detachListEvents : function(list)
    {
      list.removeListener("addItem", this.handleAddItem, this);
      list.removeListener("removeItem", this.handleRemoveItem, this);
    },


    /*
    ---------------------------------------------------------------------------
      IMPLEMENT ABSTRACT METHODS
    ---------------------------------------------------------------------------
    */

    // overridden
    _capture : function() {
      this._pane.capture();
    },


    // overridden
    _releaseCapture : function() {
      this._pane.releaseCapture();
    },


    // overridden
    _getScroll : function()
    {
      return {
        left : this._pane.getScrollX(),
        top: this._pane.getScrollY()
      };
    },


    // overridden
    _scrollBy : function(xoff, yoff)
    {
      this._pane.setScrollX(this._pane.getScrollX() + xoff);
      this._pane.setScrollY(this._pane.getScrollY() + yoff);
    },


    // overridden
    _getLocation : function()
    {
      var elem = this._pane.getContentElement().getDomElement();
      return elem ? qx.bom.element.Location.get(elem) : null;
    },


    // overridden
    _getDimension : function() {
      return this._pane.getInnerSize();
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this._pane = this._delegate = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * The Pane provides a window of a larger virtual grid.
 *
 * The actual rendering is performed by one or several layers ({@link ILayer}.
 * The pane computes, which cells of the virtual area is visible and instructs
 * the layers to render these cells.
 */
qx.Class.define("qx.ui.virtual.core.Pane",
{
  extend : qx.ui.core.Widget,


  /**
   * @param rowCount {Integer?0} The number of rows of the virtual grid.
   * @param columnCount {Integer?0} The number of columns of the virtual grid.
   * @param cellHeight {Integer?10} The default cell height.
   * @param cellWidth {Integer?10} The default cell width.
   */
  construct : function(rowCount, columnCount, cellHeight, cellWidth)
  {
    this.base(arguments);

    this.__rowConfig = new qx.ui.virtual.core.Axis(cellHeight, rowCount);
    this.__columnConfig = new qx.ui.virtual.core.Axis(cellWidth, columnCount);

    this.__scrollTop = 0;
    this.__scrollLeft = 0;


    this.__paneHeight = 0;
    this.__paneWidth = 0;

    this.__layerWindow = {};
    this.__jobs = {};

    // create layer container. The container does not have a layout manager
    // layers are positioned using "setUserBounds"
    this.__layerContainer = new qx.ui.container.Composite();
    this.__layerContainer.setUserBounds(0, 0, 0, 0);
    this._add(this.__layerContainer);

    this.__layers = [];

    this.__rowConfig.addListener("change", this.fullUpdate, this);
    this.__columnConfig.addListener("change", this.fullUpdate, this);

    this.addListener("resize", this._onResize, this);
    this.addListenerOnce("appear", this._onAppear, this);

    this.addListener("pointerdown", this._onPointerDown, this);
    this.addListener("tap", this._onTap, this);
    this.addListener("dbltap", this._onDbltap, this);
    this.addListener("contextmenu", this._onContextmenu, this);
  },


  events :
  {
    /** Fired if a cell is tapped. */
    cellTap : "qx.ui.virtual.core.CellEvent",

    /** Fired if a cell is right-clicked. */
    cellContextmenu : "qx.ui.virtual.core.CellEvent",

    /** Fired if a cell is double-tapped. */
    cellDbltap : "qx.ui.virtual.core.CellEvent",

    /** Fired on resize of either the container or the (virtual) content. */
    update : "qx.event.type.Event",

    /** Fired if the pane is scrolled horizontally. */
    scrollX : "qx.event.type.Data",

    /** Fired if the pane is scrolled vertically. */
    scrollY : "qx.event.type.Data"
  },


  properties :
  {
    // overridden
    width :
    {
      refine : true,
      init : 400
    },


    // overridden
    height :
    {
      refine : true,
      init : 300
    }
  },


  members :
  {
    __rowConfig : null,
    __columnConfig : null,
    __scrollTop : null,
    __scrollLeft : null,
    __paneHeight : null,
    __paneWidth : null,
    __layerWindow : null,
    __jobs : null,
    __layerContainer : null,
    __layers : null,
    __dontFireUpdate : null,
    __columnSizes : null,
    __rowSizes : null,
    __pointerDownCoords : null,


    /*
    ---------------------------------------------------------------------------
      ACCESSOR METHODS
    ---------------------------------------------------------------------------
    */


    /**
     * Get the axis object, which defines the row numbers and the row sizes.
     *
     * @return {Axis} The row configuration.
     */
    getRowConfig : function() {
      return this.__rowConfig;
    },


    /**
     * Get the axis object, which defines the column numbers and the column sizes.
     *
     * @return {Axis} The column configuration.
     */
    getColumnConfig : function() {
      return this.__columnConfig;
    },


    /*
    ---------------------------------------------------------------------------
      LAYER MANAGEMENT
    ---------------------------------------------------------------------------
    */


    /**
     * Returns an array containing the layer container.
     *
     * @return {Object[]} The layer container array.
     */
    getChildren : function() {
      return [this.__layerContainer];
    },


    /**
     * Add a layer to the layer container.
     *
     * @param layer {ILayer} The layer to add.
     */
    addLayer : function(layer)
    {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertInterface(layer, qx.ui.virtual.core.ILayer);
      }

      this.__layers.push(layer);
      layer.setUserBounds(0, 0, 0, 0);
      this.__layerContainer.add(layer);
    },


    /**
     * Get a list of all layers.
     *
     * @return {ILayer[]} List of the pane's layers.
     */
    getLayers : function() {
      return this.__layers;
    },


    /**
     * Get a list of all visible layers.
     *
     * @return {ILayer[]} List of the pane's visible layers.
     */
    getVisibleLayers : function()
    {
      var layers = [];
      for (var i=0; i<this.__layers.length; i++)
      {
        var layer = this.__layers[i];
        if (layer.isVisible()) {
          layers.push(layer);
        }
      }
      return layers;
    },


    /*
    ---------------------------------------------------------------------------
      SCROLL SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * The maximum horizontal scroll position.
     *
     * @return {Integer} Maximum horizontal scroll position.
     */
    getScrollMaxX : function()
    {
      var paneSize = this.getInnerSize();

      if (paneSize) {
        return Math.max(0, this.__columnConfig.getTotalSize() - paneSize.width);
      }

      return 0;
    },


    /**
     * The maximum vertical scroll position.
     *
     * @return {Integer} Maximum vertical scroll position.
     */
    getScrollMaxY : function()
    {
      var paneSize = this.getInnerSize();

      if (paneSize) {
        return Math.max(0, this.__rowConfig.getTotalSize() - paneSize.height);
      }

      return 0;
    },


    /**
     * Scrolls the content to the given left coordinate.
     *
     * @param value {Integer} The vertical position to scroll to.
     */
    setScrollY : function(value)
    {
      var max = this.getScrollMaxY();

      if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }

      if (this.__scrollTop !== value)
      {
        var old = this.__scrollTop;
        this.__scrollTop = value;
        this._deferredUpdateScrollPosition();
        this.fireDataEvent("scrollY", value, old);
      }
    },


    /**
     * Returns the vertical scroll offset.
     *
     * @return {Integer} The vertical scroll offset.
     */
    getScrollY : function() {
      return this.__scrollTop;
    },


    /**
     * Scrolls the content to the given top coordinate.
     *
     * @param value {Integer} The horizontal position to scroll to.
     */
    setScrollX : function(value)
    {
      var max = this.getScrollMaxX();

      if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }

      if (value !== this.__scrollLeft)
      {
        var old = this.__scrollLeft;
        this.__scrollLeft = value;
        this._deferredUpdateScrollPosition();

        this.fireDataEvent("scrollX", value, old);
      }
    },


    /**
     * Returns the horizontal scroll offset.
     *
     * @return {Integer} The horizontal scroll offset.
     */
    getScrollX : function() {
      return this.__scrollLeft;
    },


    /**
     * The (virtual) size of the content.
     *
     * @return {Map} Size of the content (keys: <code>width</code> and
     *     <code>height</code>).
     */
    getScrollSize : function()
    {
      return {
        width: this.__columnConfig.getTotalSize(),
        height: this.__rowConfig.getTotalSize()
      }
    },


    /*
    ---------------------------------------------------------------------------
      SCROLL INTO VIEW SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * Scrolls a row into the visible area of the pane.
     *
     * @param row {Integer} The row's index.
     */
    scrollRowIntoView : function(row)
    {
      var bounds = this.getBounds();
      if (!bounds)
      {
        this.addListenerOnce("appear", function()
        {
          // It's important that the registered events are first dispatched.
          qx.event.Timer.once(function() {
            this.scrollRowIntoView(row);
          }, this, 0);
        }, this);
        return;
      }

      var itemTop = this.__rowConfig.getItemPosition(row);
      var itemBottom = itemTop + this.__rowConfig.getItemSize(row);
      var scrollTop = this.getScrollY();

      if (itemTop < scrollTop) {
        this.setScrollY(itemTop);
      } else if (itemBottom > scrollTop + bounds.height) {
        this.setScrollY(itemBottom - bounds.height);
      }
    },


    /**
     * Scrolls a column into the visible area of the pane.
     *
     * @param column {Integer} The column's index.
     */
    scrollColumnIntoView : function(column)
    {
      var bounds = this.getBounds();
      if (!bounds)
      {
        this.addListenerOnce("appear", function()
        {
          // It's important that the registered events are first dispatched.
          qx.event.Timer.once(function() {
            this.scrollColumnIntoView(column);
          }, this, 0);
        }, this);
        return;
      }

      var itemLeft = this.__columnConfig.getItemPosition(column);
      var itemRight = itemLeft + this.__columnConfig.getItemSize(column);
      var scrollLeft = this.getScrollX();

      if (itemLeft < scrollLeft) {
        this.setScrollX(itemLeft);
      } else if (itemRight > scrollLeft + bounds.width) {
        this.setScrollX(itemRight - bounds.width);
      }
    },


    /**
     * Scrolls a grid cell into the visible area of the pane.
     *
     * @param row {Integer} The cell's row index.
     * @param column {Integer} The cell's column index.
     */
    scrollCellIntoView : function(column, row)
    {
      var bounds = this.getBounds();
      if (!bounds)
      {
        this.addListenerOnce("appear", function()
        {
          // It's important that the registered events are first dispatched.
          qx.event.Timer.once(function() {
            this.scrollCellIntoView(column, row);
          }, this, 0);
        }, this);
        return;
      }

      this.scrollColumnIntoView(column);
      this.scrollRowIntoView(row);
    },


    /*
    ---------------------------------------------------------------------------
      CELL SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * Get the grid cell at the given absolute document coordinates. This method
     * can be used to convert the pointer position returned by
     * {@link qx.event.type.Pointer#getDocumentLeft} and
     * {@link qx.event.type.Pointer#getDocumentLeft} into cell coordinates.
     *
     * @param documentX {Integer} The x coordinate relative to the viewport
     *    origin.
     * @param documentY {Integer} The y coordinate relative to the viewport
     *    origin.
     * @return {Map|null} A map containing the <code>row</code> and <code>column</code>
     *    of the found cell. If the coordinate is outside of the pane's bounds
     *    or there is no cell at the coordinate <code>null</code> is returned.
     */
    getCellAtPosition: function(documentX, documentY)
    {
      var rowData, columnData;
      var paneLocation = this.getContentLocation();

      if (
        !paneLocation ||
        documentY < paneLocation.top ||
        documentY >= paneLocation.bottom ||
        documentX < paneLocation.left ||
        documentX >= paneLocation.right
      ) {
        return null;
      }

      rowData = this.__rowConfig.getItemAtPosition(
        this.getScrollY() + documentY - paneLocation.top
      );

      columnData = this.__columnConfig.getItemAtPosition(
        this.getScrollX() + documentX - paneLocation.left
      );

      if (!rowData || !columnData) {
        return null;
      }

      return {
        row : rowData.index,
        column : columnData.index
      };
    },


    /*
    ---------------------------------------------------------------------------
      PREFETCH SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * Increase the layers width beyond the needed width to improve
     * horizontal scrolling. The layers are only resized if invisible parts
     * left/right of the pane window are smaller than minLeft/minRight.
     *
     * @param minLeft {Integer} Only prefetch if the invisible part left of the
     *    pane window if smaller than this (pixel) value.
     * @param maxLeft {Integer} The amount of pixel the layers should reach
     *    left of the pane window.
     * @param minRight {Integer} Only prefetch if the invisible part right of the
     *    pane window if smaller than this (pixel) value.
     * @param maxRight {Integer} The amount of pixel the layers should reach
     *    right of the pane window.
     */
    prefetchX : function(minLeft, maxLeft, minRight, maxRight)
    {
      var layers = this.getVisibleLayers();
      if (layers.length == 0) {
        return;
      }

      var bounds = this.getBounds();
      if (!bounds) {
        return;
      }

      var paneRight = this.__scrollLeft + bounds.width;
      var rightAvailable = this.__paneWidth - paneRight;
      if (
        this.__scrollLeft - this.__layerWindow.left  < Math.min(this.__scrollLeft, minLeft) ||
        this.__layerWindow.right - paneRight < Math.min(rightAvailable, minRight)
      )
      {
        var left = Math.min(this.__scrollLeft, maxLeft);
        var right = Math.min(rightAvailable, maxRight)
        this._setLayerWindow(
          layers,
          this.__scrollLeft - left,
          this.__scrollTop,
          bounds.width + left + right,
          bounds.height,
          false
        );
      }
    },


    /**
     * Increase the layers height beyond the needed height to improve
     * vertical scrolling. The layers are only resized if invisible parts
     * above/below the pane window are smaller than minAbove/minBelow.
     *
     * @param minAbove {Integer} Only prefetch if the invisible part above the
     *    pane window if smaller than this (pixel) value.
     * @param maxAbove {Integer} The amount of pixel the layers should reach
     *    above the pane window.
     * @param minBelow {Integer} Only prefetch if the invisible part below the
     *    pane window if smaller than this (pixel) value.
     * @param maxBelow {Integer} The amount of pixel the layers should reach
     *    below the pane window.
     */
    prefetchY : function(minAbove, maxAbove, minBelow, maxBelow)
    {
      var layers = this.getVisibleLayers();
      if (layers.length == 0) {
        return;
      }

      var bounds = this.getBounds();
      if (!bounds) {
        return;
      }

      var paneBottom = this.__scrollTop + bounds.height;
      var belowAvailable = this.__paneHeight - paneBottom;
      if (
        this.__scrollTop - this.__layerWindow.top  < Math.min(this.__scrollTop, minAbove) ||
        this.__layerWindow.bottom - paneBottom < Math.min(belowAvailable, minBelow)
      )
      {
        var above = Math.min(this.__scrollTop, maxAbove);
        var below = Math.min(belowAvailable, maxBelow)
        this._setLayerWindow(
          layers,
          this.__scrollLeft,
          this.__scrollTop - above,
          bounds.width,
          bounds.height + above + below,
          false
        );
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENT LISTENER
    ---------------------------------------------------------------------------
    */


    /**
     * Resize event handler.
     *
     * Updates the visible window.
     */
    _onResize : function()
    {
      if (this.getContentElement().getDomElement())
      {
        this.__dontFireUpdate = true;
        this._updateScrollPosition();
        this.__dontFireUpdate = null;
        this.fireEvent("update");
      }
    },


    /**
     * Resize event handler. Do a full update on first appear.
     */
    _onAppear : function() {
      this.fullUpdate();
    },

    /**
     * Event listener for pointer down. Remembers cell position to prevent pointer event when cell position change.
     *
     * @param e {qx.event.type.Pointer} The incoming pointer event.
     */
    _onPointerDown : function(e) {
      this.__pointerDownCoords = this.getCellAtPosition(e.getDocumentLeft(), e.getDocumentTop());
    },

    /**
     * Event listener for pointer taps. Fires an cellTap event.
     *
     * @param e {qx.event.type.Pointer} The incoming pointer event.
     */
    _onTap : function(e) {
      this.__handlePointerCellEvent(e, "cellTap");
    },


    /**
     * Event listener for context menu taps. Fires an cellContextmenu event.
     *
     * @param e {qx.event.type.Pointer} The incoming pointer event.
     */
    _onContextmenu : function(e) {
      this.__handlePointerCellEvent(e, "cellContextmenu");
    },


    /**
     * Event listener for double taps. Fires an cellDbltap event.
     *
     * @param e {qx.event.type.Pointer} The incoming pointer event.
     */
    _onDbltap : function(e) {
       this.__handlePointerCellEvent(e, "cellDbltap");
    },


    /**
     * Converts a pointer event into a cell event and fires the cell event if the
     * pointer is over a cell.
     *
     * @param e {qx.event.type.Pointer} The pointer event.
     * @param cellEventType {String} The name of the cell event to fire.
     */
    __handlePointerCellEvent : function(e, cellEventType)
    {
      var coords = this.getCellAtPosition(e.getDocumentLeft(), e.getDocumentTop());
      if (!coords) {
        return;
      }

      var pointerDownCoords = this.__pointerDownCoords;
      if (pointerDownCoords == null || pointerDownCoords.row !== coords.row || pointerDownCoords.column !== coords.column) {
        return;
      }

      this.fireNonBubblingEvent(
        cellEventType,
        qx.ui.virtual.core.CellEvent,
        [this, e, coords.row, coords.column]
      );
    },


    /*
    ---------------------------------------------------------------------------
      PANE UPDATE
    ---------------------------------------------------------------------------
    */


    // overridden
    syncWidget : function(jobs)
    {
      if (this.__jobs._fullUpdate) {
        this._fullUpdate();
      } else if (this.__jobs._updateScrollPosition) {
        this._updateScrollPosition();
      }
      this.__jobs = {};
    },


    /**
     * Sets the size of the layers to contain the cells at the pixel position
     * "left/right" up to "left+minHeight/right+minHeight". The offset of the
     * layer container is adjusted to respect the pane's scroll top and scroll
     * left values.
     *
     * @param layers {ILayer[]} List of layers to update.
     * @param left {Integer} Maximum left pixel coordinate of the layers.
     * @param top {Integer} Maximum top pixel coordinate of the layers.
     * @param minWidth {Integer} The minimum end coordinate of the layers will
     *    be larger than <code>left+minWidth</code>.
     * @param minHeight {Integer} The minimum end coordinate of the layers will
     *    be larger than <code>top+minHeight</code>.
     * @param doFullUpdate {Boolean?false} Whether a full update on the layer
     *    should be performed of if only the layer window should be updated.
     */
    _setLayerWindow : function(layers, left, top, minWidth, minHeight, doFullUpdate)
    {
      var rowCellData = this.__rowConfig.getItemAtPosition(top);
      if (rowCellData)
      {
        var firstRow = rowCellData.index;
        var rowSizes = this.__rowConfig.getItemSizes(firstRow, minHeight + rowCellData.offset);
        var layerHeight = qx.lang.Array.sum(rowSizes);
        var layerTop = top - rowCellData.offset;
        var layerBottom = top - rowCellData.offset + layerHeight;
      }
      else
      {
        var firstRow = 0;
        var rowSizes = [];
        var layerHeight = 0;
        var layerTop = 0;
        var layerBottom = 0;
      }

      var columnCellData = this.__columnConfig.getItemAtPosition(left);
      if (columnCellData)
      {
        var firstColumn = columnCellData.index;
        var columnSizes = this.__columnConfig.getItemSizes(firstColumn, minWidth + columnCellData.offset);
        var layerWidth = qx.lang.Array.sum(columnSizes);
        var layerLeft = left - columnCellData.offset;
        var layerRight = left - columnCellData.offset + layerWidth;
      }
      else
      {
        var firstColumn = 0;
        var columnSizes = [];
        var layerWidth = 0;
        var layerLeft = 0;
        var layerRight = 0;
      }

      this.__layerWindow = {
        top: layerTop,
        bottom: layerBottom,
        left: layerLeft,
        right: layerRight
      }

      this.__layerContainer.setUserBounds(
        (this.getPaddingLeft() || 0) + (this.__layerWindow.left - this.__scrollLeft),
        (this.getPaddingTop() || 0) + (this.__layerWindow.top - this.__scrollTop),
        layerWidth, layerHeight
      );

      this.__columnSizes = columnSizes;
      this.__rowSizes = rowSizes;

      for (var i=0; i<this.__layers.length; i++)
      {
        var layer = this.__layers[i];
        layer.setUserBounds(0, 0, layerWidth, layerHeight);

        if (doFullUpdate) {
          layer.fullUpdate(firstRow, firstColumn, rowSizes, columnSizes);
        } else {
          layer.updateLayerWindow(firstRow, firstColumn, rowSizes, columnSizes);
        }
      }
    },



    /**
     * Check whether the pane was resized and fire an {@link #update} event if
     * it was.
     */
    __checkPaneResize : function()
    {
      if (this.__dontFireUpdate) {
        return;
      }

      var scrollSize = this.getScrollSize();
      if (
        this.__paneHeight !== scrollSize.height ||
        this.__paneWidth !== scrollSize.width
      )
      {
        this.__paneHeight = scrollSize.height;
        this.__paneWidth = scrollSize.width;
        this.fireEvent("update");
      }
    },


    /**
     * Schedule a full update on all visible layers.
     */
    fullUpdate : function()
    {
      this.__jobs._fullUpdate = 1;
      qx.ui.core.queue.Widget.add(this);
    },


    /**
     * Whether a full update is scheduled.
     *
     * @return {Boolean} Whether a full update is scheduled.
     */
    isUpdatePending : function() {
      return !!this.__jobs._fullUpdate;
    },


    /**
     * Perform a full update on all visible layers. All cached data will be
     * discarded.
     */
    _fullUpdate : function()
    {
      var layers = this.getVisibleLayers();
      if (layers.length == 0)
      {
        this.__checkPaneResize();
        return;
      }

      var bounds = this.getBounds();

      if (!bounds) {
        return; // the pane has not yet been rendered -> wait for the appear event
      }



      this._setLayerWindow(
        layers,
        this.__scrollLeft, this.__scrollTop,
        bounds.width, bounds.height,
        true
      );

      this.__checkPaneResize();
    },


    /**
     * Schedule an update the visible window of the grid according to the top
     * and left scroll positions.
     */
    _deferredUpdateScrollPosition : function()
    {
      this.__jobs._updateScrollPosition = 1;
      qx.ui.core.queue.Widget.add(this);
    },


    /**
     * Update the visible window of the grid according to the top and left scroll
     * positions.
     */
    _updateScrollPosition : function()
    {
      var layers = this.getVisibleLayers();
      if (layers.length == 0)
      {
        this.__checkPaneResize();
        return;
      }

      var bounds = this.getBounds();
      if (!bounds) {
        return; // the pane has not yet been rendered -> wait for the appear event
      }

      // the visible window of the virtual coordinate space
      var paneWindow = {
        top: this.__scrollTop,
        bottom: this.__scrollTop + bounds.height,
        left: this.__scrollLeft,
        right: this.__scrollLeft + bounds.width
      };

      if (
        this.__layerWindow.top <= paneWindow.top &&
        this.__layerWindow.bottom >= paneWindow.bottom &&
        this.__layerWindow.left <= paneWindow.left &&
        this.__layerWindow.right >= paneWindow.right
      )
      {
        // only update layer container offset
        this.__layerContainer.setUserBounds(
          (this.getPaddingLeft() || 0) + (this.__layerWindow.left - paneWindow.left),
          (this.getPaddingTop() || 0) + (this.__layerWindow.top - paneWindow.top),
          this.__layerWindow.right - this.__layerWindow.left,
          this.__layerWindow.bottom - this.__layerWindow.top
        );
      }
      else
      {
        this._setLayerWindow(
          layers,
          this.__scrollLeft, this.__scrollTop,
          bounds.width, bounds.height,
          false
        )
      }

      this.__checkPaneResize();
    }
  },


  destruct : function()
  {
    this._disposeArray("__layers");
    this._disposeObjects("__rowConfig", "__columnConfig", "__layerContainer");
    this.__layerWindow = this.__jobs = this.__columnSizes =
      this.__rowSizes = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * A layer is responsible to render one aspect of a virtual pane. The pane tells
 * each layer to render/update a specific window of the virtual grid.
 */
qx.Interface.define("qx.ui.virtual.core.ILayer",
{
  members :
  {
    /**
     * Do a complete update of the layer. All cached data should be discarded.
     * This method is called e.g. after changes to the grid geometry
     * (row/column sizes, row/column count, ...).
     *
     * Note: This method can only be called after the widgets initial appear
     * event has been fired because it may work with the widget's DOM elements.
     *
     * @param firstRow {Integer} Index of the first row to display.
     * @param firstColumn {Integer} Index of the first column to display.
     * @param rowSizes {Integer[]} Array of heights for each row to display.
     * @param columnSizes {Integer[]} Array of widths for each column to display.
     */
    fullUpdate : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    ) {
      this.assertArgumentsCount(arguments, 6, 6);
      this.assertPositiveInteger(firstRow);
      this.assertPositiveInteger(firstColumn);
      this.assertArray(rowSizes);
      this.assertArray(columnSizes);
    },


    /**
     * Update the layer to display a different window of the virtual grid.
     * This method is called if the pane is scrolled, resized or cells
     * are prefetched. The implementation can assume that no other grid
     * data has been changed since the last "fullUpdate" of "updateLayerWindow"
     * call.
     *
     * Note: This method can only be called after the widgets initial appear
     * event has been fired because it may work with the widget's DOM elements.
     *
     * @param firstRow {Integer} Index of the first row to display.
     * @param firstColumn {Integer} Index of the first column to display.
     * @param rowSizes {Integer[]} Array of heights for each row to display.
     * @param columnSizes {Integer[]} Array of widths for each column to display.
     */
    updateLayerWindow : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    ) {
      this.assertArgumentsCount(arguments, 6, 6);
      this.assertPositiveInteger(firstRow);
      this.assertPositiveInteger(firstColumn);
      this.assertArray(rowSizes);
      this.assertArray(columnSizes);
    },


    /**
     * Update the layer to reflect changes in the data the layer displays.
     */
    updateLayerData : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * David Perez Carmona (david-perez)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * A cell event instance contains all data for pointer events related to cells in
 * a pane.
 **/
qx.Class.define("qx.ui.virtual.core.CellEvent",
{
  extend : qx.event.type.Pointer,


  properties :
  {
    /** The table row of the event target. */
    row :
    {
      check : "Integer",
      nullable: true
    },

    /** The table column of the event target. */
    column :
    {
      check : "Integer",
      nullable: true
    }
  },


  members :
  {
     /**
      * Initialize the event.
      *
      * @param scroller {qx.ui.table.pane.Scroller} The tables pane scroller.
      * @param me {qx.event.type.Pointer} The original pointer event.
      * @param row {Integer?null} The cell's row index.
      * @param column {Integer?null} The cell's column index.
      */
     init : function(scroller, me, row, column)
     {
       me.clone(this);
       this.setBubbles(false);

       this.setRow(row);
       this.setColumn(column);
     }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * The axis maps virtual screen coordinates to item indexes. By default all
 * items have the same size but it is also possible to give specific items
 * a different size.
 */
qx.Class.define("qx.ui.virtual.core.Axis",
{
  extend : qx.core.Object,

  /**
   * @param defaultItemSize {Integer} The default size of the items.
   * @param itemCount {Integer} The number of item on the axis.
   */
  construct : function(defaultItemSize, itemCount)
  {
    this.base(arguments);

    this.itemCount = itemCount;
    this.defaultItemSize = defaultItemSize;

    // sparse array
    this.customSizes = {};
  },


  events :
  {
    /** Every change to the axis configuration triggers this event. */
    "change" : "qx.event.type.Event"
  },


  members :
  {
    __ranges : null,


    /**
     * Get the default size of the items.
     *
     * @return {Integer} The default item size.
     */
    getDefaultItemSize : function() {
      return this.defaultItemSize;
    },


    /**
     * Set the default size the items.
     *
     * @param defaultItemSize {Integer} The default size of the items.
     */
    setDefaultItemSize : function(defaultItemSize)
    {
      if (this.defaultItemSize !== defaultItemSize)
      {
        this.defaultItemSize = defaultItemSize;
        this.__ranges = null;
        this.fireNonBubblingEvent("change");
      }
    },


    /**
     * Get the number of items in the axis.
     *
     * @return {Integer} The number of items.
     */
    getItemCount : function() {
      return this.itemCount;
    },


    /**
     * Set the number of items in the axis.
     *
     * @param itemCount {Integer} The new item count.
     */
    setItemCount : function(itemCount)
    {
      if (this.itemCount !== itemCount)
      {
        this.itemCount = itemCount;
        this.__ranges = null;
        this.fireNonBubblingEvent("change");
      }
    },


    /**
     * Sets the size of a specific item. This allow item, which have a size
     * different from the default size.
     *
     * @param index {Integer} Index of the item to change.
     * @param size {Integer} New size of the item.
     */
    setItemSize : function(index, size)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertArgumentsCount(arguments, 2, 2);
        this.assert(
          size > 0 || size === null,
          "'size' must be 'null' or an integer larger than 0."
        );
      }
      if (this.customSizes[index] == size) {
        return;
      }

      if (size === null) {
        delete this.customSizes[index];
      } else {
        this.customSizes[index] = size;
      }
      this.__ranges = null;
      this.fireNonBubblingEvent("change");
    },


    /**
     * Get the size of the item at the given index.
     *
     * @param index {Integer} Index of the item to get the size for.
     * @return {Integer} Size of the item.
     */
    getItemSize : function(index)
    {
      // custom size of 0 is not allowed
      return this.customSizes[index] || this.defaultItemSize;
    },


    /**
     * Reset all custom sizes set with {@link #setItemSize}.
     */
    resetItemSizes : function()
    {
      this.customSizes = {};
      this.__ranges = null;
      this.fireNonBubblingEvent("change");
    },


    /**
     * Split the position range into disjunct intervals. Each interval starts
     * with a custom sized cell. Each position is contained in exactly one range.
     * The ranges are sorted according to their start position.
     *
     * Complexity: O(n log n) (n = number of custom sized cells)
     *
     * @return {Map[]} The sorted list of ranges.
     */
    __getRanges : function()
    {
      if (this.__ranges) {
        return this.__ranges;
      }

      var defaultSize = this.defaultItemSize;
      var itemCount = this.itemCount;

      var indexes = [];
      for (var key in this.customSizes)
      {
        var index = parseInt(key, 10);
        if (index < itemCount) {
          indexes.push(index);
        }
      }
      if (indexes.length == 0)
      {
        var ranges = [{
          startIndex: 0,
          endIndex: itemCount - 1,
          firstItemSize: defaultSize,
          rangeStart: 0,
          rangeEnd: itemCount * defaultSize - 1
        }];
        this.__ranges = ranges;
        return ranges;
      }

      indexes.sort(function(a,b) { return a > b ? 1 : -1});

      var ranges = [];
      var correctionSum = 0;

      for (var i=0; i<indexes.length; i++)
      {
        var index = indexes[i];
        if (index >= itemCount) {
          break;
        }

        var cellSize = this.customSizes[index];
        var rangeStart = index * defaultSize + correctionSum;

        correctionSum += cellSize - defaultSize;

        ranges[i] = {
          startIndex: index,
          firstItemSize: cellSize,
          rangeStart: rangeStart
        };
        if (i > 0) {
          ranges[i-1].rangeEnd = rangeStart-1;
          ranges[i-1].endIndex = index-1;
        }
      }

      // fix first range
      if (ranges[0].rangeStart > 0)
      {
        ranges.unshift({
          startIndex: 0,
          endIndex: ranges[0].startIndex-1,
          firstItemSize: defaultSize,
          rangeStart: 0,
          rangeEnd: ranges[0].rangeStart-1
        });
      }

      // fix last range
      var lastRange = ranges[ranges.length-1];
      var remainingItemsSize = (itemCount - lastRange.startIndex - 1) * defaultSize;
      lastRange.rangeEnd = lastRange.rangeStart + lastRange.firstItemSize + remainingItemsSize - 1;
      lastRange.endIndex = itemCount - 1;

      this.__ranges = ranges;
      return ranges;
    },


    /**
     * Returns the range, which contains the position
     *
     * Complexity: O(log n) (n = number of custom sized cells)
     *
     * @param position {Integer} The position.
     * @return {Map} The range, which contains the given position.
     */
    __findRangeByPosition : function(position)
    {
      var ranges = this.__ranges || this.__getRanges();

      var start = 0;
      var end = ranges.length-1;

      // binary search in the sorted ranges list
      while (true)
      {
        var pivot = start + ((end - start) >> 1);
        var range = ranges[pivot];

        if (range.rangeEnd < position) {
          start = pivot + 1;
        } else if (range.rangeStart > position) {
          end = pivot - 1;
        } else {
          return range;
        }
      }
    },


    /**
     * Get the item and the offset into the item at the given position.
     *
     * @param position {Integer|null} The position to get the item for.
     * @return {Map} A map with the keys <code>index</code> and
     *    <code>offset</code>. The index is the index of the item containing the
     *    position and offsets specifies offset into this item. If the position
     *    is outside of the range, <code>null</code> is returned.
     */
    getItemAtPosition : function(position)
    {
      if (position < 0 || position >= this.getTotalSize()) {
        return null;
      }

      var range = this.__findRangeByPosition(position);

      var startPos = range.rangeStart;
      var index = range.startIndex;
      var firstItemSize = range.firstItemSize;

      if (startPos + firstItemSize > position)
      {
        return {
          index: index,
          offset: position - startPos
        }
      }
      else
      {
        var defaultSize = this.defaultItemSize;
        return {
          index: index + 1 + Math.floor((position - startPos - firstItemSize) / defaultSize),
          offset: (position - startPos - firstItemSize) % defaultSize
        }
      }
    },


    /**
     * Returns the range, which contains the position.
     *
     * Complexity: O(log n) (n = number of custom sized cells)
     *
     * @param index {Integer} The index of the item to get the range for.
     * @return {Map} The range for the index.
     */
    __findRangeByIndex : function(index)
    {
      var ranges = this.__ranges || this.__getRanges();

      var start = 0;
      var end = ranges.length-1;

      // binary search in the sorted ranges list
      while (true)
      {
        var pivot = start + ((end - start) >> 1);
        var range = ranges[pivot];

        if (range.endIndex < index) {
          start = pivot + 1;
        } else if (range.startIndex > index) {
          end = pivot - 1;
        } else {
          return range;
        }
      }
    },


    /**
     * Get the start position of the item with the given index.
     *
     * @param index {Integer} The item's index.
     * @return {Integer|null} The start position of the item. If the index is outside
     *    of the axis range <code>null</code> is returned.
     */
    getItemPosition : function(index)
    {
      if (index < 0 || index >= this.itemCount) {
        return null;
      }

      var range = this.__findRangeByIndex(index);

      if (range.startIndex == index) {
        return range.rangeStart;
      } else {
        return range.rangeStart + range.firstItemSize + (index-range.startIndex-1) * this.defaultItemSize;
      }
    },


    /**
     * Returns the sum of all cell sizes.
     *
     * @return {Integer} The sum of all item sizes.
     */
    getTotalSize : function()
    {
      var ranges = this.__ranges || this.__getRanges();
      return ranges[ranges.length-1].rangeEnd + 1;
    },


    /**
     * Get an array of item sizes starting with the item at "startIndex". The
     * sum of all sizes in the returned array is at least "minSizeSum".
     *
     * @param startIndex {Integer} The index of the first item.
     * @param minSizeSum {Integer} The minimum sum of the item sizes.
     * @return {Integer[]} List of item sizes starting with the size of the item
     *    at index <code>startIndex</code>. The sum of the item sizes is at least
     *    <code>minSizeSum</code>.
     */
    getItemSizes : function(startIndex, minSizeSum)
    {
      var customSizes = this.customSizes;
      var defaultSize = this.defaultItemSize;

      var sum = 0;
      var sizes = [];
      var i=0;
      while (sum < minSizeSum)
      {
        var itemSize = customSizes[startIndex++] || defaultSize;
        sum += itemSize;
        sizes[i++] = itemSize;
        if (startIndex >= this.itemCount) {
          break;
        }
      }
      return sizes;
    }
  },


  destruct : function() {
    this.customSizes = this.__ranges = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * Row selection manager
 */
qx.Class.define("qx.ui.virtual.selection.Row",
{
  extend : qx.ui.virtual.selection.Abstract,


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Returns the number of all items in the pane. This number may contain
     * unselectable items as well.
     *
     * @return {Integer} number of items
     */
    _getItemCount : function() {
      return this._pane.getRowConfig().getItemCount();
    },


    /*
    ---------------------------------------------------------------------------
      IMPLEMENT ABSTRACT METHODS
    ---------------------------------------------------------------------------
    */

    // overridden
    _getSelectableFromPointerEvent : function(event)
    {
      var cell = this._pane.getCellAtPosition(
        event.getDocumentLeft(),
        event.getDocumentTop()
      );

      if (!cell) {
        return null;
      }

      return this._isSelectable(cell.row) ? cell.row : null;
    },


    // overridden
    getSelectables : function(all)
    {
      var selectables = [];

      for (var i=0, l=this._getItemCount(); i<l; i++)
      {
        if (this._isSelectable(i)) {
          selectables.push(i);
        }
      }

      return selectables;
    },


    // overridden
    _getSelectableRange : function(item1, item2)
    {
      var selectables = [];
      var min = Math.min(item1, item2);
      var max = Math.max(item1, item2);

      for (var i=min; i<=max; i++)
      {
        if (this._isSelectable(i)) {
          selectables.push(i);
        }
      }

      return selectables;
    },


    // overridden
    _getFirstSelectable : function()
    {
      var count = this._getItemCount();
      for (var i=0; i<count; i++)
      {
        if (this._isSelectable(i)) {
          return i;
        }
      }
      return null;
    },


    // overridden
    _getLastSelectable : function()
    {
      var count = this._getItemCount();
      for (var i=count-1; i>=0; i--)
      {
        if (this._isSelectable(i)) {
          return i;
        }
      }
      return null;
    },


    // overridden
    _getRelatedSelectable : function(item, relation)
    {
      if (relation == "above")
      {
        var startIndex = item-1;
        var endIndex = 0;
        var increment = -1;
      }
      else if (relation == "under")
      {
        var startIndex = item+1;
        var endIndex = this._getItemCount()-1;
        var increment = 1;
      }
      else
      {
        return null;
      }

      for (var i=startIndex; i !== endIndex+increment; i += increment)
      {
        if (this._isSelectable(i)) {
          return i;
        }
      }
      return null;
    },


    // overridden
    _getPage : function(lead, up)
    {
      if (up) {
        return this._getFirstSelectable();
      } else {
        return this._getLastSelectable();
      }
    },


    // overridden
    _selectableToHashCode : function(item) {
      return item;
    },


    // overridden
    _scrollItemIntoView : function(item) {
      this._pane.scrollRowIntoView(item);
    },


    // overridden
    _getSelectableLocationX : function(item)
    {
      return {
        left: 0,
        right: this._pane.getColumnConfig().getTotalSize() - 1
      };
    },


    // overridden
    _getSelectableLocationY : function(item)
    {
      var rowConfig = this._pane.getRowConfig();

      var itemTop = rowConfig.getItemPosition(item);
      var itemBottom = itemTop + rowConfig.getItemSize(item) - 1;

      return {
        top: itemTop,
        bottom: itemBottom
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin used for the bubbling events. If you want to use this in your own model
 * classes, be sure that every property will call the
 * {@link #_applyEventPropagation} function on every change.
 */
qx.Mixin.define("qx.data.marshal.MEventBubbling",
{

  events :
  {
    /**
     * The change event which will be fired on every change in the model no
     * matter what property changes. This event bubbles so the root model will
     * fire a change event on every change of its children properties too.
     *
     * Note that properties are required to call
     * {@link #_applyEventPropagation} on apply for changes to be tracked as
     * desired. It is already taken care of that properties created with the
     * {@link qx.data.marshal.Json} marshaler call this method.
     *
     * The data will contain a map with the following three keys
     *   <li>value: The new value of the property</li>
     *   <li>old: The old value of the property.</li>
     *   <li>name: The name of the property changed including its parent
     *     properties separated by dots.</li>
     *   <li>item: The item which has the changed property.</li>
     * Due to that, the <code>getOldData</code> method will always return null
     * because the old data is contained in the map.
     */
    "changeBubble": "qx.event.type.Data"
  },


  members :
  {
    /**
     * Apply function for every property created with the
     * {@link qx.data.marshal.Json} marshaler. It fires and
     * {@link #changeBubble} event on every change. It also adds the chaining
     * listener if possible which is necessary for the bubbling of the events.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _applyEventPropagation : function(value, old, name)
    {
      this.fireDataEvent("changeBubble", {
        value: value, name: name, old: old, item: this
      });

      this._registerEventChaining(value, old, name);
    },


    /**
     * Registers for the given parameters the changeBubble listener, if
     * possible. It also removes the old listener, if an old item with
     * a changeBubble event is given.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _registerEventChaining : function(value, old, name)
    {
      // if an old value is given, remove the old listener if possible
      if (old != null && old.getUserData && old.getUserData("idBubble-" + this.$$hash) != null) {
        var listeners = old.getUserData("idBubble-" + this.$$hash);
        for (var i = 0; i < listeners.length; i++) {
          old.removeListenerById(listeners[i]);
        }
        old.setUserData("idBubble-" + this.$$hash, null);
      }

      // if the child supports chaining
      if ((value instanceof qx.core.Object)
        && qx.Class.hasMixin(value.constructor, qx.data.marshal.MEventBubbling)
      ) {
        // create the listener
        var listener = qx.lang.Function.bind(
          this.__changePropertyListener, this, name
        );
        // add the listener
        var id = value.addListener("changeBubble", listener, this);
        var listeners = value.getUserData("idBubble-" + this.$$hash);
        if (listeners == null)
        {
          listeners = [];
          value.setUserData("idBubble-" + this.$$hash, listeners);
        }
        listeners.push(id);
      }
    },


    /**
     * Listener responsible for formating the name and firing the change event
     * for the changed property.
     *
     * @param name {String} The name of the former properties.
     * @param e {qx.event.type.Data} The date event fired by the property
     *   change.
     */
    __changePropertyListener : function(name, e)
    {
      var data = e.getData();
      var value = data.value;
      var old = data.old;

      // if the target is an array
      if (qx.Class.hasInterface(e.getTarget().constructor, qx.data.IListData)) {

        if (data.name.indexOf) {
          var dotIndex = data.name.indexOf(".") != -1 ? data.name.indexOf(".") : data.name.length;
          var bracketIndex = data.name.indexOf("[") != -1 ? data.name.indexOf("[") : data.name.length;

          // braktes in the first spot is ok [BUG #5985]
          if (bracketIndex == 0) {
            var newName = name + data.name;
          } else if (dotIndex < bracketIndex) {
            var index = data.name.substring(0, dotIndex);
            var rest = data.name.substring(dotIndex + 1, data.name.length);
            if (rest[0] != "[") {
              rest = "." + rest;
            }
            var newName =  name + "[" + index + "]" + rest;
          } else if (bracketIndex < dotIndex) {
            var index = data.name.substring(0, bracketIndex);
            var rest = data.name.substring(bracketIndex, data.name.length);
            var newName =  name + "[" + index + "]" + rest;
          } else {
            var newName =  name + "[" + data.name + "]";
          }
        } else {
          var newName =  name + "[" + data.name + "]";
        }

      // if the target is not an array
      } else {
        // special case for array as first element of the chain [BUG #5985]
        if (parseInt(name) == name && name !== "") {
          name = "[" + name + "]";
        }
        var newName =  name + "." + data.name;
      }

      this.fireDataEvent(
        "changeBubble",
        {
          value: value,
          name: newName,
          old: old,
          item: data.item || e.getTarget()
        }
      );
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The data array is a special array used in the data binding context of
 * qooxdoo. It does not extend the native array of JavaScript but its a wrapper
 * for it. All the native methods are included in the implementation and it
 * also fires events if the content or the length of the array changes in
 * any way. Also the <code>.length</code> property is available on the array.
 */
qx.Class.define("qx.data.Array",
{
  extend : qx.core.Object,
  include : qx.data.marshal.MEventBubbling,
  implement : [qx.data.IListData],

  /**
   * Creates a new instance of an array.
   *
   * @param param {var} The parameter can be some types.<br/>
   *   Without a parameter a new blank array will be created.<br/>
   *   If there is more than one parameter is given, the parameter will be
   *   added directly to the new array.<br/>
   *   If the parameter is a number, a new Array with the given length will be
   *   created.<br/>
   *   If the parameter is a JavaScript array, a new array containing the given
   *   elements will be created.
   */
  construct : function(param)
  {
    this.base(arguments);
    // if no argument is given
    if (param == undefined) {
      this.__array = [];

    // check for elements (create the array)
    } else if (arguments.length > 1) {
      // create an empty array and go through every argument and push it
      this.__array = [];
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
      }

    // check for a number (length)
    } else if (typeof param == "number") {
      this.__array = new Array(param);
    // check for an array itself
    } else if (param instanceof Array) {
      this.__array = qx.lang.Array.clone(param);

    // error case
    } else {
      this.__array = [];
      this.dispose();
      throw new Error("Type of the parameter not supported!");
    }

    // propagate changes
    for (var i=0; i<this.__array.length; i++) {
      this._applyEventPropagation(this.__array[i], null, i);
    }

    // update the length at startup
    this.__updateLength();

    // work against the console printout of the array
    if (qx.core.Environment.get("qx.debug")) {
      this[0] = "Please use 'toArray()' to see the content.";
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Flag to set the dispose behavior of the array. If the property is set to
     * <code>true</code>, the array will dispose its content on dispose, too.
     */
    autoDisposeItems : {
      check : "Boolean",
      init : false
    }
  },

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * The change event which will be fired if there is a change in the array.
     * The data contains a map with three key value pairs:
     * <li>start: The start index of the change.</li>
     * <li>end: The end index of the change.</li>
     * <li>type: The type of the change as a String. This can be 'add',
     * 'remove', 'order' or 'add/remove'</li>
     * <li>added: The items which has been added (as a JavaScript array)</li>
     * <li>removed: The items which has been removed (as a JavaScript array)</li>
     */
    "change" : "qx.event.type.Data",


    /**
     * The changeLength event will be fired every time the length of the
     * array changes.
     */
    "changeLength": "qx.event.type.Data"
  },


  members :
  {
    // private members
    __array : null,


    /**
     * Concatenates the current and the given array into a new one.
     *
     * @param array {Array} The javaScript array which should be concatenated
     *   to the current array.
     *
     * @return {qx.data.Array} A new array containing the values of both former
     *   arrays.
     */
    concat: function(array) {
      if (array) {
        var newArray = this.__array.concat(array);
      } else {
        var newArray = this.__array.concat();
      }
      return new qx.data.Array(newArray);
    },


    /**
     * Returns the array as a string using the given connector string to
     * connect the values.
     *
     * @param connector {String} the string which should be used to past in
     *  between of the array values.
     *
     * @return {String} The array as a string.
     */
    join: function(connector) {
      return this.__array.join(connector);
    },


    /**
     * Removes and returns the last element of the array.
     * An change event will be fired.
     *
     * @return {var} The last element of the array.
     */
    pop: function() {
      var item = this.__array.pop();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length - 1);
      // fire change bubble event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: this.length + "",
        old: [item],
        item: this
      });

      this.fireDataEvent("change",
        {
          start: this.length - 1,
          end: this.length - 1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Adds an element at the end of the array.
     *
     * @param varargs {var} Multiple elements. Every element will be added to
     *   the end of the array. An change event will be fired.
     *
     * @return {Number} The new length of the array.
     */
    push: function(varargs) {
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
        this.__updateLength();
        // apply to every pushed item an event listener for the bubbling
        this._registerEventChaining(arguments[i], null, this.length - 1);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [arguments[i]],
          name: (this.length - 1) + "",
          old: [],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: this.length - 1,
            end: this.length - 1,
            type: "add",
            added: [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Reverses the order of the array. An change event will be fired.
     */
    reverse: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var oldArray = this.__array.concat();
      this.__array.reverse();

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.__array.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Removes the first element of the array and returns it. An change event
     * will be fired.
     *
     * @return {var} the former first element.
     */
    shift: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var item = this.__array.shift();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length -1);
      // as every item has changed its position, we need to update the event bubbling
      this.__updateEventPropagation(0, this.length);

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0",
        old: [item],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: this.length -1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Returns a new array based on the range specified by the parameters.
     *
     * @param from {Number} The start index.
     * @param to {Number?null} The zero-based end index. <code>slice</code> extracts
     *   up to but not including <code>to</code>. If omitted, slice extracts to the
     *   end of the array.
     *
     * @return {qx.data.Array} A new array containing the given range of values.
     */
    slice: function(from, to) {
      return new qx.data.Array(this.__array.slice(from, to));
    },


    /**
     * Method to remove and add new elements to the array. For every remove or
     * add an event will be fired.
     *
     * @param startIndex {Integer} The index where the splice should start
     * @param amount {Integer} Defines number of elements which will be removed
     *   at the given position.
     * @param varargs {var} All following parameters will be added at the given
     *   position to the array.
     * @return {qx.data.Array} An data array containing the removed elements.
     *   Keep in to dispose this one, even if you don't use it!
     */
    splice: function(startIndex, amount, varargs) {
      // store the old length
      var oldLength = this.__array.length;

      // invoke the slice on the array
      var returnArray = this.__array.splice.apply(this.__array, arguments);

      // fire a change event for the length
      if (this.__array.length != oldLength) {
        this.__updateLength();
      } else if (amount == arguments.length - 2) {
        // if we added as much items as we removed
        var addedItems = qx.lang.Array.fromArguments(arguments, 2)
        // check if the array content equals the content before the operation
        for (var i = 0; i < addedItems.length; i++) {
          if (addedItems[i] !== returnArray[i]) {
            break;
          }
          // if all added and removed items are queal
          if (i == addedItems.length -1) {
            // prevent all events and return a new array
            return new qx.data.Array();
          }
        }
      }
      // fire an event for the change
      var removed = amount > 0;
      var added = arguments.length > 2;
      if (removed || added) {
        var addedItems = qx.lang.Array.fromArguments(arguments, 2);

        if (returnArray.length == 0) {
          var type = "add";
          var end = startIndex + addedItems.length;
        } else if (addedItems.length == 0) {
          var type = "remove";
          var end = this.length - 1;
        } else {
          var type = "add/remove";
          var end = startIndex + Math.abs(addedItems.length - returnArray.length);
        }
        this.fireDataEvent("change",
          {
            start: startIndex,
            end: end,
            type: type,
            added : addedItems,
            removed : returnArray
          }, null
        );
      }

      // remove the listeners first [BUG #7132]
      for (var i = 0; i < returnArray.length; i++) {
        this._registerEventChaining(null, returnArray[i], i);
      }

      // add listeners
      for (var i = 2; i < arguments.length; i++) {
        this._registerEventChaining(arguments[i], null, startIndex + (i - 2));
      }
      // apply event chaining for every item moved
      this.__updateEventPropagation(startIndex + (arguments.length - 2) - amount, this.length);

      // fire the changeBubble event
      var value = [];
      for (var i=2; i < arguments.length; i++) {
        value[i-2] = arguments[i];
      };
      var endIndex = (startIndex + Math.max(arguments.length - 3 , amount - 1));
      var name = startIndex == endIndex ? endIndex : startIndex + "-" + endIndex;
      this.fireDataEvent("changeBubble", {
        value: value, name: name + "", old: returnArray, item: this
      });

      return (new qx.data.Array(returnArray));
    },


    /**
     * Sorts the array. If a function is given, this will be used to
     * compare the items. <code>changeBubble</code> event will only be fired,
     * if sorting result differs from original array.
     *
     * @param func {Function} A compare function comparing two parameters and
     *   should return a number.
     */
    sort: function(func) {
      // ignore if the array is empty
      if (this.length == 0) {
        return;
      }
      var oldArray = this.__array.concat();

      this.__array.sort.apply(this.__array, arguments);

      // prevent changeBubble event if nothing has been changed
      if (qx.lang.Array.equals(this.__array, oldArray) === true){
        return;
      }

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Adds the given items to the beginning of the array. For every element,
     * a change event will be fired.
     *
     * @param varargs {var} As many elements as you want to add to the beginning.
     * @return {Integer} The new length of the array
     */
    unshift: function(varargs) {
      for (var i = arguments.length - 1; i >= 0; i--) {
        this.__array.unshift(arguments[i]);
        this.__updateLength();
        // apply to every item an event listener for the bubbling
        this.__updateEventPropagation(0, this.length);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [this.__array[0]],
          name: "0",
          old: [this.__array[1]],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: 0,
            end: this.length - 1,
            type: "add",
            added : [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Returns the list data as native array. Beware of the fact that the
     * internal representation will be returnd and any manipulation of that
     * can cause a misbehavior of the array. This method should only be used for
     * debugging purposes.
     *
     * @return {Array} The native array.
     */
    toArray: function() {
      return this.__array;
    },


    /**
     * Replacement function for the getting of the array value.
     * array[0] should be array.getItem(0).
     *
     * @param index {Number} The index requested of the array element.
     *
     * @return {var} The element at the given index.
     */
    getItem: function(index) {
      return this.__array[index];
    },


    /**
     * Replacement function for the setting of an array value.
     * array[0] = "a" should be array.setItem(0, "a").
     * A change event will be fired if the value changes. Setting the same
     * value again will not lead to a change event.
     *
     * @param index {Number} The index of the array element.
     * @param item {var} The new item to set.
     */
    setItem: function(index, item) {
      var oldItem = this.__array[index];
      // ignore settings of already set items [BUG #4106]
      if (oldItem === item) {
        return;
      }
      this.__array[index] = item;
      // set an event listener for the bubbling
      this._registerEventChaining(item, oldItem, index);
      // only update the length if its changed
      if (this.length != this.__array.length) {
        this.__updateLength();
      }

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [item],
        name: index + "",
        old: [oldItem],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: index,
          end: index,
          type: "add/remove",
          added: [item],
          removed: [oldItem]
        }, null
      );
    },


    /**
     * This method returns the current length stored under .length on each
     * array.
     *
     * @return {Number} The current length of the array.
     */
    getLength: function() {
      return this.length;
    },


    /**
     * Returns the index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    indexOf: function(item) {
      return this.__array.indexOf(item);
    },

    /**
     * Returns the last index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    lastIndexOf: function(item) {
      return this.__array.lastIndexOf(item);
    },


    /**
     * Returns the toString of the original Array
     * @return {String} The array as a string.
     */
    toString: function() {
      if (this.__array != null) {
        return this.__array.toString();
      }
      return "";
    },


    /*
    ---------------------------------------------------------------------------
       IMPLEMENTATION OF THE QX.LANG.ARRAY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Check if the given item is in the current array.
     *
     * @param item {var} The item which is possibly in the array.
     * @return {Boolean} true, if the array contains the given item.
     */
    contains: function(item) {
      return this.__array.indexOf(item) !== -1;
    },


    /**
     * Return a copy of the given arr
     *
     * @return {qx.data.Array} copy of this
     */
    copy : function() {
      return this.concat();
    },


    /**
     * Insert an element at a given position.
     *
     * @param index {Integer} Position where to insert the item.
     * @param item {var} The element to insert.
     */
    insertAt : function(index, item)
    {
      this.splice(index, 0, item).dispose();
    },


    /**
     * Insert an item into the array before a given item.
     *
     * @param before {var} Insert item before this object.
     * @param item {var} The item to be inserted.
     */
    insertBefore : function(before, item)
    {
      var index = this.indexOf(before);

      if (index == -1) {
        this.push(item);
      } else {
        this.splice(index, 0, item).dispose();
      }
    },


    /**
     * Insert an element into the array after a given item.
     *
     * @param after {var} Insert item after this object.
     * @param item {var} Object to be inserted.
     */
    insertAfter : function(after, item)
    {
      var index = this.indexOf(after);

      if (index == -1 || index == (this.length - 1)) {
        this.push(item);
      } else {
        this.splice(index + 1, 0, item).dispose();
      }
    },


    /**
     * Remove an element from the array at the given index.
     *
     * @param index {Integer} Index of the item to be removed.
     * @return {var} The removed item.
     */
    removeAt : function(index) {
      var returnArray = this.splice(index, 1);
      var item = returnArray.getItem(0);
      returnArray.dispose();
      return item;
    },


    /**
     * Remove all elements from the array.
     *
     * @return {Array} A native array containing the removed elements.
     */
    removeAll : function() {
      // remove all possible added event listeners
      for (var i = 0; i < this.__array.length; i++) {
        this._registerEventChaining(null, this.__array[i], i);
      }

      // ignore if array is empty
      if (this.getLength() == 0) {
        return [];
      }

      // store the old data
      var oldLength = this.getLength();
      var items = this.__array.concat();

      // change the length
      this.__array.length = 0;
      this.__updateLength();

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0-" + (oldLength - 1),
        old: items,
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: oldLength - 1,
          type: "remove",
          removed : items,
          added : []
        }, null
      );
      return items;
    },


    /**
     * Append the items of the given array.
     *
     * @param array {Array|qx.data.IListData} The items of this array will
     * be appended.
     * @throws {Error} if the second argument is not an array.
     */
    append : function(array)
    {
      // qooxdoo array support
      if (array instanceof qx.data.Array) {
        array = array.toArray();
      }

      // this check is important because opera throws an uncatchable error if
      // apply is called without an array as argument.
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertArray(array, "The parameter must be an array.");
      }

      Array.prototype.push.apply(this.__array, array);

      // add a listener to the new items
      for (var i = 0; i < array.length; i++) {
        this._registerEventChaining(array[i], null, this.__array.length + i);
      }

      var oldLength = this.length;
      this.__updateLength();

      // fire change bubbles
      var name =
        oldLength == (this.length-1) ?
        oldLength :
        oldLength + "-" + (this.length-1);
      this.fireDataEvent("changeBubble", {
        value: array,
        name: name + "",
        old: [],
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: oldLength,
          end: this.length - 1,
          type: "add",
          added : array,
          removed : []
        }, null
      );
    },


    /**
     * Remove the given item.
     *
     * @param item {var} Item to be removed from the array.
     * @return {var} The removed item.
     */
    remove : function(item)
    {
      var index = this.indexOf(item);

      if (index != -1)
      {
        this.splice(index, 1).dispose();
        return item;
      }
    },


    /**
     * Check whether the given array has the same content as this.
     * Checks only the equality of the arrays' content.
     *
     * @param array {qx.data.Array} The array to check.
     * @return {Boolean} Whether the two arrays are equal.
     */
    equals : function(array)
    {
      if (this.length !== array.length) {
        return false;
      }

      for (var i = 0; i < this.length; i++)
      {
        if (this.getItem(i) !== array.getItem(i)) {
          return false;
        }
      }

      return true;
    },


    /**
     * Returns the sum of all values in the array. Supports
     * numeric values only.
     *
     * @return {Number} The sum of all values.
     */
    sum : function()
    {
      var result = 0;
      for (var i = 0; i < this.length; i++) {
        result += this.getItem(i);
      }

      return result;
    },


    /**
     * Returns the highest value in the given array.
     * Supports numeric values only.
     *
     * @return {Number | null} The highest of all values or undefined if the
     *   array is empty.
     */
    max : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) > result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Returns the lowest value in the array. Supports
     * numeric values only.
     *
     * @return {Number | null} The lowest of all values or undefined
     *   if the array is empty.
     */
    min : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) < result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Invokes the given function for every item in the array.
     *
     * @param callback {Function} The function which will be call for every
     *   item in the array. It will be invoked with three parameters:
     *   the item, the index and the array itself.
     * @param context {var} The context in which the callback will be invoked.
     */
    forEach : function(callback, context)
    {
      for (var i = 0; i < this.__array.length; i++) {
        callback.call(context, this.__array[i], i, this);
      }
    },


    /*
    ---------------------------------------------------------------------------
      Additional JS1.6 methods
    ---------------------------------------------------------------------------
    */
    /**
     * Creates a new array with all elements that pass the test implemented by
     * the provided function. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing only the items
     *  which passed the test.
     */
    filter : function(callback, self) {
      return new qx.data.Array(this.__array.filter(callback, self));
    },


    /**
     * Creates a new array with the results of calling a provided function on every
     * element in this array. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The mapping function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing the new created items.
     */
    map : function(callback, self) {
      return new qx.data.Array(this.__array.map(callback, self));
    },


    /**
     * Tests whether any element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if any element passed the test function.
     */
    some : function(callback, self) {
      return this.__array.some(callback, self);
    },


    /**
     * Tests whether every element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if every element passed the test function.
     */
    every : function(callback, self) {
      return this.__array.every(callback, self);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from left-to-right) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduce : function(callback, initValue) {
      return this.__array.reduce(callback, initValue);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from right-to-left) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduceRight : function(callback, initValue) {
      return this.__array.reduceRight(callback, initValue);
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Internal function which updates the length property of the array.
     * Every time the length will be updated, a {@link #changeLength} data
     * event will be fired.
     */
    __updateLength: function() {
      var oldLength = this.length;
      this.length = this.__array.length;
      this.fireDataEvent("changeLength", this.length, oldLength);
    },


    /**
     * Helper to update the event propagation for a range of items.
     * @param from {Number} Start index.
     * @param to {Number} End index.
     */
    __updateEventPropagation : function(from, to) {
      for (var i=from; i < to; i++) {
        this._registerEventChaining(this.__array[i], this.__array[i], i);
      };
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
  */

  destruct : function() {
    for (var i = 0; i < this.__array.length; i++) {
      var item = this.__array[i];
      this._applyEventPropagation(null, item, i);

      // dispose the items on auto dispose
      if (this.isAutoDisposeItems() && item && item instanceof qx.core.Object) {
        item.dispose();
      }
    }

    this.__array = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

qx.core.Environment.add("qx.nativeScrollBars", false);

/**
 * Include this widget if you want to create scrollbars depending on the global
 * "qx.nativeScrollBars" setting.
 */
qx.Mixin.define("qx.ui.core.scroll.MScrollBarFactory",
{
  members :
  {
    /**
     * Creates a new scrollbar. This can either be a styled qooxdoo scrollbar
     * or a native browser scrollbar.
     *
     * @param orientation {String?"horizontal"} The initial scroll bar orientation
     * @return {qx.ui.core.scroll.IScrollBar} The scrollbar instance
     */
    _createScrollBar : function(orientation)
    {
      if (qx.core.Environment.get("qx.nativeScrollBars")) {
        return new qx.ui.core.scroll.NativeScrollBar(orientation);
      } else {
        return new qx.ui.core.scroll.ScrollBar(orientation);
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * All widget used as scrollbars must implement this interface.
 */
qx.Interface.define("qx.ui.core.scroll.IScrollBar",
{
  events :
  {
    /** Fired if the user scroll */
    "scroll" : "qx.event.type.Data",
    /** Fired as soon as the scroll animation ended. */
    "scrollAnimationEnd": 'qx.event.type.Event'
  },


  properties :
  {
    /**
     * The scroll bar orientation
     */
    orientation : {},


    /**
     * The maximum value (difference between available size and
     * content size).
     */
    maximum : {},


    /**
     * Position of the scrollbar (which means the scroll left/top of the
     * attached area's pane)
     *
     * Strictly validates according to {@link #maximum}.
     * Does not apply any correction to the incoming value. If you depend
     * on this, please use {@link #scrollTo} instead.
     */
    position : {},


    /**
     * Factor to apply to the width/height of the knob in relation
     * to the dimension of the underlying area.
     */
    knobFactor : {}
  },


  members :
  {
    /**
     * Scrolls to the given position.
     *
     * This method automatically corrects the given position to respect
     * the {@link #maximum}.
     *
     * @param position {Integer} Scroll to this position. Must be greater zero.
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    scrollTo : function(position, duration) {
      this.assertNumber(position);
    },


    /**
     * Scrolls by the given offset.
     *
     * This method automatically corrects the given position to respect
     * the {@link #maximum}.
     *
     * @param offset {Integer} Scroll by this offset
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    scrollBy : function(offset, duration) {
      this.assertNumber(offset);
    },


    /**
     * Scrolls by the given number of steps.
     *
     * This method automatically corrects the given position to respect
     * the {@link #maximum}.
     *
     * @param steps {Integer} Number of steps
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    scrollBySteps : function(steps, duration) {
      this.assertNumber(steps);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The scroll bar widget, is a special slider, which is used in qooxdoo instead
 * of the native browser scroll bars.
 *
 * Scroll bars are used by the {@link qx.ui.container.Scroll} container. Usually
 * a scroll bar is not used directly.
 *
 * @childControl slider {qx.ui.core.scroll.ScrollSlider} scroll slider component
 * @childControl button-begin {qx.ui.form.RepeatButton} button to scroll to top
 * @childControl button-end {qx.ui.form.RepeatButton} button to scroll to bottom
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var scrollBar = new qx.ui.core.scroll.ScrollBar("horizontal");
 *   scrollBar.set({
 *     maximum: 500
 *   })
 *   this.getRoot().add(scrollBar);
 * </pre>
 *
 * This example creates a horizontal scroll bar with a maximum value of 500.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/scrollbar.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.core.scroll.ScrollBar",
{
  extend : qx.ui.core.Widget,
  implement : qx.ui.core.scroll.IScrollBar,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param orientation {String?"horizontal"} The initial scroll bar orientation
   */
  construct : function(orientation)
  {
    this.base(arguments);

    // Create child controls
    this._createChildControl("button-begin");
    this._createChildControl("slider").addListener("resize", this._onResizeSlider, this);
    this._createChildControl("button-end");

    // Configure orientation
    if (orientation != null) {
      this.setOrientation(orientation);
    } else {
      this.initOrientation();
    }

    // prevent drag & drop on scrolling
    this.addListener("track", function(e) {
      e.stopPropagation();
    }, this);
  },


  events : {
    /** Change event for the value. */
    "scrollAnimationEnd": "qx.event.type.Event"
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "scrollbar"
    },


    /**
     * The scroll bar orientation
     */
    orientation :
    {
      check : [ "horizontal", "vertical" ],
      init : "horizontal",
      apply : "_applyOrientation"
    },


    /**
     * The maximum value (difference between available size and
     * content size).
     */
    maximum :
    {
      check : "PositiveInteger",
      apply : "_applyMaximum",
      init : 100
    },


    /**
     * Position of the scrollbar (which means the scroll left/top of the
     * attached area's pane)
     *
     * Strictly validates according to {@link #maximum}.
     * Does not apply any correction to the incoming value. If you depend
     * on this, please use {@link #scrollTo} instead.
     */
    position :
    {
      check : "qx.lang.Type.isNumber(value)&&value>=0&&value<=this.getMaximum()",
      init : 0,
      apply : "_applyPosition",
      event : "scroll"
    },


    /**
     * Step size for each tap on the up/down or left/right buttons.
     */
    singleStep :
    {
      check : "Integer",
      init : 20
    },


    /**
     * The amount to increment on each event. Typically corresponds
     * to the user pressing <code>PageUp</code> or <code>PageDown</code>.
     */
    pageStep :
    {
      check : "Integer",
      init : 10,
      apply : "_applyPageStep"
    },


    /**
     * Factor to apply to the width/height of the knob in relation
     * to the dimension of the underlying area.
     */
    knobFactor :
    {
      check : "PositiveNumber",
      apply : "_applyKnobFactor",
      nullable : true
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __offset : 2,
    __originalMinSize : 0,


    // overridden
    _computeSizeHint : function() {
      var hint = this.base(arguments);
      if (this.getOrientation() === "horizontal") {
        this.__originalMinSize = hint.minWidth;
        hint.minWidth = 0;
      } else {
        this.__originalMinSize = hint.minHeight;
        hint.minHeight = 0;
      }
      return hint;
    },


    // overridden
    renderLayout : function(left, top, width, height) {
      var changes = this.base(arguments, left, top, width, height);
      var horizontal = this.getOrientation() === "horizontal";
      if (this.__originalMinSize >= (horizontal ? width : height)) {
        this.getChildControl("button-begin").setVisibility("hidden");
        this.getChildControl("button-end").setVisibility("hidden");
      } else {
        this.getChildControl("button-begin").setVisibility("visible");
        this.getChildControl("button-end").setVisibility("visible");
      }

      return changes
    },

    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "slider":
          control = new qx.ui.core.scroll.ScrollSlider();
          control.setPageStep(100);
          control.setFocusable(false);
          control.addListener("changeValue", this._onChangeSliderValue, this);
          control.addListener("slideAnimationEnd", this._onSlideAnimationEnd, this);
          this._add(control, {flex: 1});
          break;

        case "button-begin":
          // Top/Left Button
          control = new qx.ui.form.RepeatButton();
          control.setFocusable(false);
          control.addListener("execute", this._onExecuteBegin, this);
          this._add(control);
          break;

        case "button-end":
          // Bottom/Right Button
          control = new qx.ui.form.RepeatButton();
          control.setFocusable(false);
          control.addListener("execute", this._onExecuteEnd, this);
          this._add(control);
          break;
      }

      return control || this.base(arguments, id);
    },




    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyMaximum : function(value) {
      this.getChildControl("slider").setMaximum(value);
    },


    // property apply
    _applyPosition : function(value) {
      this.getChildControl("slider").setValue(value);
    },


    // property apply
    _applyKnobFactor : function(value) {
      this.getChildControl("slider").setKnobFactor(value);
    },


    // property apply
    _applyPageStep : function(value) {
      this.getChildControl("slider").setPageStep(value);
    },


    // property apply
    _applyOrientation : function(value, old)
    {
      // Dispose old layout
      var oldLayout = this._getLayout();
      if (oldLayout) {
        oldLayout.dispose();
      }

      // Reconfigure
      if (value === "horizontal")
      {
        this._setLayout(new qx.ui.layout.HBox());

        this.setAllowStretchX(true);
        this.setAllowStretchY(false);

        this.replaceState("vertical", "horizontal");

        this.getChildControl("button-begin").replaceState("up", "left");
        this.getChildControl("button-end").replaceState("down", "right");
      }
      else
      {
        this._setLayout(new qx.ui.layout.VBox());

        this.setAllowStretchX(false);
        this.setAllowStretchY(true);

        this.replaceState("horizontal", "vertical");

        this.getChildControl("button-begin").replaceState("left", "up");
        this.getChildControl("button-end").replaceState("right", "down");
      }

      // Sync slider orientation
      this.getChildControl("slider").setOrientation(value);
    },





    /*
    ---------------------------------------------------------------------------
      METHOD REDIRECTION TO SLIDER
    ---------------------------------------------------------------------------
    */

    /**
     * Scrolls to the given position.
     *
     * This method automatically corrects the given position to respect
     * the {@link #maximum}.
     *
     * @param position {Integer} Scroll to this position. Must be greater zero.
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    scrollTo : function(position, duration) {
      this.getChildControl("slider").slideTo(position, duration);
    },


    /**
     * Scrolls by the given offset.
     *
     * This method automatically corrects the given position to respect
     * the {@link #maximum}.
     *
     * @param offset {Integer} Scroll by this offset
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    scrollBy : function(offset, duration) {
      this.getChildControl("slider").slideBy(offset, duration);
    },


    /**
     * Scrolls by the given number of steps.
     *
     * This method automatically corrects the given position to respect
     * the {@link #maximum}.
     *
     * @param steps {Integer} Number of steps
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    scrollBySteps : function(steps, duration) {
      var size = this.getSingleStep();
      this.getChildControl("slider").slideBy(steps * size, duration);
    },


    /**
     * Updates the position property considering the minimum and maximum values.
     * @param position {Number} The new position.
     */
    updatePosition : function(position) {
      this.getChildControl("slider").updatePosition(position);
    },


    /**
     * If a scroll animation is running, it will be stopped.
     */
    stopScrollAnimation : function() {
      this.getChildControl("slider").stopSlideAnimation();
    },


    /*
    ---------------------------------------------------------------------------
      EVENT LISTENER
    ---------------------------------------------------------------------------
    */

    /**
     * Executed when the up/left button is executed (pressed)
     *
     * @param e {qx.event.type.Event} Execute event of the button
     */
    _onExecuteBegin : function(e) {
      this.scrollBy(-this.getSingleStep(), 50);
    },


    /**
     * Executed when the down/right button is executed (pressed)
     *
     * @param e {qx.event.type.Event} Execute event of the button
     */
    _onExecuteEnd : function(e) {
      this.scrollBy(this.getSingleStep(), 50);
    },


    /**
     * Change listener for slider animation end.
     */
    _onSlideAnimationEnd : function() {
      this.fireEvent("scrollAnimationEnd");
    },


    /**
     * Change listener for slider value changes.
     *
     * @param e {qx.event.type.Data} The change event object
     */
    _onChangeSliderValue : function(e) {
      this.setPosition(e.getData());
    },

    /**
     * Hide the knob of the slider if the slidebar is too small or show it
     * otherwise.
     *
     * @param e {qx.event.type.Data} event object
     */
    _onResizeSlider : function(e)
    {
      var knob = this.getChildControl("slider").getChildControl("knob");
      var knobHint = knob.getSizeHint();
      var hideKnob = false;
      var sliderSize = this.getChildControl("slider").getInnerSize();

      if (this.getOrientation() == "vertical")
      {
        if (sliderSize.height  < knobHint.minHeight + this.__offset) {
          hideKnob = true;
        }
      }
      else
      {
        if (sliderSize.width  < knobHint.minWidth + this.__offset) {
          hideKnob = true;
        }
      }

      if (hideKnob) {
        knob.exclude();
      } else {
        knob.show();
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which are executable in some way. This
 * could be a button for example.
 */
qx.Interface.define("qx.ui.form.IExecutable",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the widget is executed. Sets the "data" property of the
     * event to the object that issued the command.
     */
    "execute" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      COMMAND PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Set the command of this executable.
     *
     * @param command {qx.ui.core.Command} The command.
     */
    setCommand : function(command) {
      return arguments.length == 1;
    },


    /**
     * Return the current set command of this executable.
     *
     * @return {qx.ui.core.Command} The current set command.
     */
    getCommand : function() {},


    /**
     * Fire the "execute" event on the command.
     */
    execute: function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This mixin is included by all widgets, which support an 'execute' like
 * buttons or menu entries.
 */
qx.Mixin.define("qx.ui.core.MExecutable",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired if the {@link #execute} method is invoked.*/
    "execute" : "qx.event.type.Event"
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * A command called if the {@link #execute} method is called, e.g. on a
     * button tap.
     */
    command :
    {
      check : "qx.ui.core.Command",
      apply : "_applyCommand",
      event : "changeCommand",
      nullable : true
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __executableBindingIds : null,
    __semaphore : false,
    __executeListenerId : null,


    /**
     * @type {Map} Set of properties, which will by synced from the command to the
     *    including widget
     *
     * @lint ignoreReferenceField(_bindableProperties)
     */
    _bindableProperties :
    [
      "enabled",
      "label",
      "icon",
      "toolTipText",
      "value",
      "menu"
    ],


    /**
     * Initiate the execute action.
     */
    execute : function()
    {
      var cmd = this.getCommand();

      if (cmd) {
        if (this.__semaphore) {
          this.__semaphore = false;
        } else {
          this.__semaphore = true;
          cmd.execute(this);
        }
      }

      this.fireEvent("execute");
    },


    /**
     * Handler for the execute event of the command.
     *
     * @param e {qx.event.type.Event} The execute event of the command.
     */
    __onCommandExecute : function(e) {
      if (this.__semaphore) {
        this.__semaphore = false;
        return;
      }
      this.__semaphore = true;
      this.execute();
    },


    // property apply
    _applyCommand : function(value, old)
    {
      // execute forwarding
      if (old != null) {
        old.removeListenerById(this.__executeListenerId);
      }
      if (value != null) {
        this.__executeListenerId = value.addListener(
          "execute", this.__onCommandExecute, this
        );
      }

      // binding stuff
      var ids = this.__executableBindingIds;
      if (ids == null) {
        this.__executableBindingIds = ids = {};
      }

      var selfPropertyValue;
      for (var i = 0; i < this._bindableProperties.length; i++) {
        var property = this._bindableProperties[i];

        // remove the old binding
        if (old != null && !old.isDisposed() && ids[property] != null)
        {
          old.removeBinding(ids[property]);
          ids[property] = null;
        }

        // add the new binding
        if (value != null && qx.Class.hasProperty(this.constructor, property)) {
          // handle the init value (dont sync the initial null)
          var cmdPropertyValue = value.get(property);
          if (cmdPropertyValue == null) {
            selfPropertyValue = this.get(property);
            // check also for themed values [BUG #5906]
            if (selfPropertyValue == null) {
              // update the appearance to make sure every themed property is up to date
              this.syncAppearance();
              selfPropertyValue = qx.util.PropertyUtil.getThemeValue(
                this, property
              );
            }
          } else {
            // Reset the self property value [BUG #4534]
            selfPropertyValue = null;
          }
          // set up the binding
          ids[property] = value.bind(property, this, property);
          // reapply the former value
          if (selfPropertyValue) {
            this.set(property, selfPropertyValue);
          }
        }
      }
    }
  },


  destruct : function() {
    this._applyCommand(null, this.getCommand());
    this.__executableBindingIds = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A Button widget which supports various states and allows it to be used
 * via the mouse, touch, pen and the keyboard.
 *
 * If the user presses the button by clicking on it, or the <code>Enter</code> or
 * <code>Space</code> keys, the button fires an {@link qx.ui.core.MExecutable#execute} event.
 *
 * If the {@link qx.ui.core.MExecutable#command} property is set, the
 * command is executed as well.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var button = new qx.ui.form.Button("Hello World");
 *
 *   button.addListener("execute", function(e) {
 *     alert("Button was clicked");
 *   }, this);
 *
 *   this.getRoot().add(button);
 * </pre>
 *
 * This example creates a button with the label "Hello World" and attaches an
 * event listener to the {@link #execute} event.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/button.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.form.Button",
{
  extend : qx.ui.basic.Atom,
  include : [qx.ui.core.MExecutable],
  implement : [qx.ui.form.IExecutable],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String} label of the atom
   * @param icon {String?null} Icon URL of the atom
   * @param command {qx.ui.core.Command?null} Command instance to connect with
   */
  construct : function(label, icon, command)
  {
    this.base(arguments, label, icon);

    if (command != null) {
      this.setCommand(command);
    }

    // Add listeners
    this.addListener("pointerover", this._onPointerOver);
    this.addListener("pointerout", this._onPointerOut);
    this.addListener("pointerdown", this._onPointerDown);
    this.addListener("pointerup", this._onPointerUp);
    this.addListener("tap", this._onTap);

    this.addListener("keydown", this._onKeyDown);
    this.addListener("keyup", this._onKeyUp);

    // Stop events
    this.addListener("dbltap", this._onStopEvent);
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "button"
    },

    // overridden
    focusable :
    {
      refine : true,
      init : true
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      focused : true,
      hovered : true,
      pressed : true,
      disabled : true
    },


    /*
    ---------------------------------------------------------------------------
      USER API
    ---------------------------------------------------------------------------
    */

    /**
     * Manually press the button
     */
    press : function()
    {
      if (this.hasState("abandoned")) {
        return;
      }

      this.addState("pressed");
    },


    /**
     * Manually release the button
     */
    release : function()
    {
      if (this.hasState("pressed")) {
        this.removeState("pressed");
      }
    },


    /**
     * Completely reset the button (remove all states)
     */
    reset : function()
    {
      this.removeState("pressed");
      this.removeState("abandoned");
      this.removeState("hovered");
    },



    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Listener method for "pointerover" event
     * <ul>
     * <li>Adds state "hovered"</li>
     * <li>Removes "abandoned" and adds "pressed" state (if "abandoned" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerOver : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      if (this.hasState("abandoned"))
      {
        this.removeState("abandoned");
        this.addState("pressed");
      }

      this.addState("hovered");
    },


    /**
     * Listener method for "pointerout" event
     * <ul>
     * <li>Removes "hovered" state</li>
     * <li>Adds "abandoned" and removes "pressed" state (if "pressed" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerOut : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      this.removeState("hovered");

      if (this.hasState("pressed"))
      {
        this.removeState("pressed");
        this.addState("abandoned");
      }
    },


    /**
     * Listener method for "pointerdown" event
     * <ul>
     * <li>Removes "abandoned" state</li>
     * <li>Adds "pressed" state</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerDown : function(e)
    {
      if (!e.isLeftPressed()) {
        return;
      }

      e.stopPropagation();

      // Activate capturing if the button get a pointerout while
      // the button is pressed.
      this.capture();

      this.removeState("abandoned");
      this.addState("pressed");
    },


    /**
     * Listener method for "pointerup" event
     * <ul>
     * <li>Removes "pressed" state (if set)</li>
     * <li>Removes "abandoned" state (if set)</li>
     * <li>Adds "hovered" state (if "abandoned" state is not set)</li>
     *</ul>
     *
     * @param e {Event} Mouse event
     */
    _onPointerUp : function(e)
    {
      this.releaseCapture();

      // We must remove the states before executing the command
      // because in cases were the window lost the focus while
      // executing we get the capture phase back (mouseout).
      var hasPressed = this.hasState("pressed");
      var hasAbandoned = this.hasState("abandoned");

      if (hasPressed) {
        this.removeState("pressed");
      }

      if (hasAbandoned) {
        this.removeState("abandoned");
      }

      e.stopPropagation();
    },


    /**
     * Listener method for "tap" event which stops the propagation.
     *
     * @param e {qx.event.type.Pointer} Pointer event
     */
    _onTap : function(e) {
      // "execute" is fired here so that the button can be dragged
      // without executing it (e.g. in a TabBar with overflow)
      this.execute();
      e.stopPropagation();
    },


    /**
     * Listener method for "keydown" event.<br/>
     * Removes "abandoned" and adds "pressed" state
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyDown : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          this.removeState("abandoned");
          this.addState("pressed");
          e.stopPropagation();
      }
    },


    /**
     * Listener method for "keyup" event.<br/>
     * Removes "abandoned" and "pressed" state (if "pressed" state is set)
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyUp : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          if (this.hasState("pressed"))
          {
            this.removeState("abandoned");
            this.removeState("pressed");
            this.execute();
            e.stopPropagation();
          }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Martin Wittemann (martinwittemann)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The RepeatButton is a special button, which fires repeatedly {@link #execute}
 * events, while a button is pressed on the button. The initial delay
 * and the interval time can be set using the properties {@link #firstInterval}
 * and {@link #interval}. The {@link #execute} events will be fired in a shorter
 * amount of time if a button is hold, until the min {@link #minTimer}
 * is reached. The {@link #timerDecrease} property sets the amount of milliseconds
 * which will decreased after every firing.
 *
 * <pre class='javascript'>
 *   var button = new qx.ui.form.RepeatButton("Hello World");
 *
 *   button.addListener("execute", function(e) {
 *     alert("Button is executed");
 *   }, this);
 *
 *   this.getRoot.add(button);
 * </pre>
 *
 * This example creates a button with the label "Hello World" and attaches an
 * event listener to the {@link #execute} event.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/repeatbutton.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.form.RepeatButton",
{
  extend : qx.ui.form.Button,


  /**
   * @param label {String} Label to use
   * @param icon {String?null} Icon to use
   */
  construct : function(label, icon)
  {
    this.base(arguments, label, icon);

    // create the timer and add the listener
    this.__timer = new qx.event.AcceleratingTimer();
    this.__timer.addListener("interval", this._onInterval, this);
  },


  events :
  {
    /**
     * This event gets dispatched with every interval. The timer gets executed
     * as long as the user holds down a button.
     */
    "execute" : "qx.event.type.Event",

    /**
     * This event gets dispatched when the button is pressed.
     */
    "press"   : "qx.event.type.Event",

    /**
     * This event gets dispatched when the button is released.
     */
    "release" : "qx.event.type.Event"
  },


  properties :
  {
    /**
     * Interval used after the first run of the timer. Usually a smaller value
     * than the "firstInterval" property value to get a faster reaction.
     */
    interval :
    {
      check : "Integer",
      init  : 100
    },

    /**
     * Interval used for the first run of the timer. Usually a greater value
     * than the "interval" property value to a little delayed reaction at the first
     * time.
     */
    firstInterval :
    {
      check : "Integer",
      init  : 500
    },

    /** This configures the minimum value for the timer interval. */
    minTimer :
    {
      check : "Integer",
      init  : 20
    },

    /** Decrease of the timer on each interval (for the next interval) until minTimer reached. */
    timerDecrease :
    {
      check : "Integer",
      init  : 2
    }
  },


  members :
  {
    __executed : null,
    __timer : null,


    /**
     * Calling this function is like a tap from the user on the
     * button with all consequences.
     * <span style='color: red'>Be sure to call the {@link #release} function.</span>
     *
     */
    press : function()
    {
      // only if the button is enabled
      if (this.isEnabled())
      {
        // if the state pressed must be applied (first call)
        if (!this.hasState("pressed"))
        {
          // start the timer
          this.__startInternalTimer();
        }

        // set the states
        this.removeState("abandoned");
        this.addState("pressed");
      }
    },


    /**
     * Calling this function is like a release from the user on the
     * button with all consequences.
     * Usually the {@link #release} function will be called before the call of
     * this function.
     *
     * @param fireExecuteEvent {Boolean?true} flag which signals, if an event should be fired
     */
    release : function(fireExecuteEvent)
    {
      // only if the button is enabled
      if (!this.isEnabled()) {
        return;
      }

      // only if the button is pressed
      if (this.hasState("pressed"))
      {
        // if the button has not been executed
        if (!this.__executed) {
          this.execute();
        }
      }

      // remove button states
      this.removeState("pressed");
      this.removeState("abandoned");

      // stop the repeat timer and therefore the execution
      this.__stopInternalTimer();
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // overridden
    _applyEnabled : function(value, old)
    {
      this.base(arguments, value, old);

      if (!value)
      {
        if (this.isCapturing()) {
          // also release capture because out event is missing on iOS
          this.releaseCapture();
        }

        // remove button states
        this.removeState("pressed");
        this.removeState("abandoned");

        // stop the repeat timer and therefore the execution
        this.__stopInternalTimer();
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Listener method for "pointerover" event
     * <ul>
     * <li>Adds state "hovered"</li>
     * <li>Removes "abandoned" and adds "pressed" state (if "abandoned" state is set)</li>
     * </ul>
     *
     * @param e {Event} Pointer event
     */
    _onPointerOver : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      if (this.hasState("abandoned"))
      {
        this.removeState("abandoned");
        this.addState("pressed");
        this.__timer.start();
      }

      this.addState("hovered");
    },


    /**
     * Listener method for "pointerout" event
     * <ul>
     * <li>Removes "hovered" state</li>
     * <li>Adds "abandoned" and removes "pressed" state (if "pressed" state is set)</li>
     * </ul>
     *
     * @param e {Event} Pointer event
     */
    _onPointerOut : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      this.removeState("hovered");

      if (this.hasState("pressed"))
      {
        this.removeState("pressed");
        this.addState("abandoned");
        this.__timer.stop();
      }
    },


    /**
     * Callback method for the "pointerdown" method.
     *
     * Sets the interval of the timer (value of firstInterval property) and
     * starts the timer. Additionally removes the state "abandoned" and adds the
     * state "pressed".
     *
     * @param e {qx.event.type.Pointer} pointerdown event
     */
    _onPointerDown : function(e)
    {
      if (!e.isLeftPressed()) {
        return;
      }

      // Activate capturing if the button get a pointerout while
      // the button is pressed.
      this.capture();

      this.__startInternalTimer();
      e.stopPropagation();
    },


    /**
     * Callback method for the "pointerup" event.
     *
     * Handles the case that the user is releasing a button
     * before the timer interval method got executed. This way the
     * "execute" method get executed at least one time.
     *
     * @param e {qx.event.type.Pointer} pointerup event
     */
    _onPointerUp : function(e)
    {
      this.releaseCapture();

      if (!this.hasState("abandoned"))
      {
        this.addState("hovered");

        if (this.hasState("pressed") && !this.__executed) {
          this.execute();
        }
      }

      this.__stopInternalTimer();
      e.stopPropagation();
    },


    // Nothing to do, 'execute' is already fired by _onPointerUp.
    _onTap : function(e) {},


    /**
     * Listener method for "keyup" event.
     *
     * Removes "abandoned" and "pressed" state (if "pressed" state is set)
     * for the keys "Enter" or "Space" and stops the internal timer
     * (same like pointer up).
     *
     * @param e {Event} Key event
     */
    _onKeyUp : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          if (this.hasState("pressed"))
          {
            if (!this.__executed) {
              this.execute();
            }

            this.removeState("pressed");
            this.removeState("abandoned");
            e.stopPropagation();
            this.__stopInternalTimer();
          }
      }
    },


    /**
     * Listener method for "keydown" event.
     *
     * Removes "abandoned" and adds "pressed" state
     * for the keys "Enter" or "Space". It also starts
     * the internal timer (same like pointerdown).
     *
     * @param e {Event} Key event
     */
    _onKeyDown : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          this.removeState("abandoned");
          this.addState("pressed");
          e.stopPropagation();
          this.__startInternalTimer();
      }
    },


    /**
     * Callback for the interval event.
     *
     * Stops the timer and starts it with a new interval
     * (value of the "interval" property - value of the "timerDecrease" property).
     * Dispatches the "execute" event.
     *
     * @param e {qx.event.type.Event} interval event
     */
    _onInterval : function(e)
    {
      this.__executed = true;
      this.fireEvent("execute");
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL TIMER
    ---------------------------------------------------------------------------
    */

    /**
     * Starts the internal timer which causes firing of execution
     * events in an interval. It also presses the button.
     *
     */
    __startInternalTimer : function()
    {
      this.fireEvent("press");

      this.__executed = false;

      this.__timer.set({
        interval: this.getInterval(),
        firstInterval: this.getFirstInterval(),
        minimum: this.getMinTimer(),
        decrease: this.getTimerDecrease()
      }).start();

      this.removeState("abandoned");
      this.addState("pressed");
    },


    /**
     * Stops the internal timer and releases the button.
     *
     */
    __stopInternalTimer : function()
    {
      this.fireEvent("release");

      this.__timer.stop();

      this.removeState("abandoned");
      this.removeState("pressed");
    }
  },




  /*
    *****************************************************************************
       DESTRUCTOR
    *****************************************************************************
    */

  destruct : function() {
    this._disposeObjects("__timer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Timer, which accelerates after each interval. The initial delay and the
 * interval time can be set using the properties {@link #firstInterval}
 * and {@link #interval}. The {@link #interval} events will be fired with
 * decreasing interval times while the timer is running, until the {@link #minimum}
 * is reached. The {@link #decrease} property sets the amount of milliseconds
 * which will decreased after every firing.
 *
 * This class is e.g. used in the {@link qx.ui.form.RepeatButton} and
 * {@link qx.ui.form.HoverButton} widgets.
 */
qx.Class.define("qx.event.AcceleratingTimer",
{
  extend : qx.core.Object,

  construct : function()
  {
    this.base(arguments);

    this.__timer = new qx.event.Timer(this.getInterval());
    this.__timer.addListener("interval", this._onInterval, this);
  },


  events :
  {
    /** This event if fired each time the interval time has elapsed */
    "interval" : "qx.event.type.Event"
  },


  properties :
  {
    /**
     * Interval used after the first run of the timer. Usually a smaller value
     * than the "firstInterval" property value to get a faster reaction.
     */
    interval :
    {
      check : "Integer",
      init  : 100
    },

    /**
     * Interval used for the first run of the timer. Usually a greater value
     * than the "interval" property value to a little delayed reaction at the first
     * time.
     */
    firstInterval :
    {
      check : "Integer",
      init  : 500
    },

    /** This configures the minimum value for the timer interval. */
    minimum :
    {
      check : "Integer",
      init  : 20
    },

    /** Decrease of the timer on each interval (for the next interval) until minTimer reached. */
    decrease :
    {
      check : "Integer",
      init  : 2
    }
  },


  members :
  {
    __timer : null,
    __currentInterval : null,

    /**
     * Reset and start the timer.
     */
    start : function()
    {
      this.__timer.setInterval(this.getFirstInterval());
      this.__timer.start();
    },


    /**
     * Stop the timer
     */
    stop : function()
    {
      this.__timer.stop();
      this.__currentInterval = null;
    },


    /**
     * Interval event handler
     */
    _onInterval : function()
    {
      this.__timer.stop();

      if (this.__currentInterval == null) {
        this.__currentInterval = this.getInterval();
      }

      this.__currentInterval = Math.max(
        this.getMinimum(),
        this.__currentInterval - this.getDecrease()
      );

      this.__timer.setInterval(this.__currentInterval);
      this.__timer.start();

      this.fireEvent("interval");
    }
  },


  destruct : function() {
    this._disposeObjects("__timer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin handling the valid and required properties for the form widgets.
 */
qx.Mixin.define("qx.ui.form.MForm",
{

  construct : function()
  {
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener("changeLocale", this.__onChangeLocale, this);
    }
  },


  properties : {

    /**
     * Flag signaling if a widget is valid. If a widget is invalid, an invalid
     * state will be set.
     */
    valid : {
      check : "Boolean",
      init : true,
      apply : "_applyValid",
      event : "changeValid"
    },


    /**
     * Flag signaling if a widget is required.
     */
    required : {
      check : "Boolean",
      init : false,
      event : "changeRequired"
    },


    /**
     * Message which is shown in an invalid tooltip.
     */
    invalidMessage : {
      check : "String",
      init: "",
      event : "changeInvalidMessage"
    },


    /**
     * Message which is shown in an invalid tooltip if the {@link #required} is
     * set to true.
     */
    requiredInvalidMessage : {
      check : "String",
      nullable : true,
      event : "changeInvalidMessage"
    }
  },


  members : {
    // apply method
    _applyValid: function(value, old) {
      value ? this.removeState("invalid") : this.addState("invalid");
    },


    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    __onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e)
      {
        // invalid message
        var invalidMessage = this.getInvalidMessage();
        if (invalidMessage && invalidMessage.translate) {
          this.setInvalidMessage(invalidMessage.translate());
        }
        // required invalid message
        var requiredInvalidMessage = this.getRequiredInvalidMessage();
        if (requiredInvalidMessage && requiredInvalidMessage.translate) {
          this.setRequiredInvalidMessage(requiredInvalidMessage.translate());
        }
      },

      "false" : null
    })
  },


  destruct : function()
  {
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this.__onChangeLocale, this);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all widgets which deal with ranges. The spinner is a good
 * example for a range using widget.
 */
qx.Interface.define("qx.ui.form.IRange",
{

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      MINIMUM PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Set the minimum value of the range.
     *
     * @param min {Number} The minimum.
     */
    setMinimum : function(min) {
      return arguments.length == 1;
    },


    /**
     * Return the current set minimum of the range.
     *
     * @return {Number} The current set minimum.
     */
    getMinimum : function() {},


    /*
    ---------------------------------------------------------------------------
      MAXIMUM PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Set the maximum value of the range.
     *
     * @param max {Number} The maximum.
     */
    setMaximum : function(max) {
      return arguments.length == 1;
    },


    /**
     * Return the current set maximum of the range.
     *
     * @return {Number} The current set maximum.
     */
    getMaximum : function() {},


    /*
    ---------------------------------------------------------------------------
      SINGLESTEP PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the value for single steps in the range.
     *
     * @param step {Number} The value of the step.
     */
    setSingleStep : function(step) {
      return arguments.length == 1;
    },


    /**
     * Returns the value which will be stepped in a single step in the range.
     *
     * @return {Number} The current value for single steps.
     */
    getSingleStep : function() {},


    /*
    ---------------------------------------------------------------------------
      PAGESTEP PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the value for page steps in the range.
     *
     * @param step {Number} The value of the step.
     */
    setPageStep : function(step) {
      return arguments.length == 1;
    },


    /**
     * Returns the value which will be stepped in a page step in the range.
     *
     * @return {Number} The current value for page steps.
     */
    getPageStep : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which use a numeric value as their
 * primary data type like a spinner.
 */
qx.Interface.define("qx.ui.form.INumberForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Number|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Number|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The Slider widget provides a vertical or horizontal slider.
 *
 * The Slider is the classic widget for controlling a bounded value.
 * It lets the user move a slider handle along a horizontal or vertical
 * groove and translates the handle's position into an integer value
 * within the defined range.
 *
 * The Slider has very few of its own functions.
 * The most useful functions are slideTo() to set the slider directly to some
 * value; setSingleStep(), setPageStep() to set the steps; and setMinimum()
 * and setMaximum() to define the range of the slider.
 *
 * A slider accepts focus on Tab and provides both a mouse wheel and
 * a keyboard interface. The keyboard interface is the following:
 *
 * * Left/Right move a horizontal slider by one single step.
 * * Up/Down move a vertical slider by one single step.
 * * PageUp moves up one page.
 * * PageDown moves down one page.
 * * Home moves to the start (minimum).
 * * End moves to the end (maximum).
 *
 * Here are the main properties of the class:
 *
 * # <code>value</code>: The bounded integer that {@link qx.ui.form.INumberForm}
 * maintains.
 * # <code>minimum</code>: The lowest possible value.
 * # <code>maximum</code>: The highest possible value.
 * # <code>singleStep</code>: The smaller of two natural steps that an abstract
 * sliders provides and typically corresponds to the user pressing an arrow key.
 * # <code>pageStep</code>: The larger of two natural steps that an abstract
 * slider provides and typically corresponds to the user pressing PageUp or
 * PageDown.
 *
 * @childControl knob {qx.ui.core.Widget} knob to set the value of the slider
 */
qx.Class.define("qx.ui.form.Slider",
{
  extend : qx.ui.core.Widget,
  implement : [
    qx.ui.form.IForm,
    qx.ui.form.INumberForm,
    qx.ui.form.IRange
  ],
  include : [qx.ui.form.MForm],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param orientation {String?"horizontal"} Configure the
   * {@link #orientation} property
   */
  construct : function(orientation)
  {
    this.base(arguments);

    // Force canvas layout
    this._setLayout(new qx.ui.layout.Canvas());

    // Add listeners
    this.addListener("keypress", this._onKeyPress);
    this.addListener("roll", this._onRoll);
    this.addListener("pointerdown", this._onPointerDown);
    this.addListener("pointerup", this._onPointerUp);
    this.addListener("losecapture", this._onPointerUp);
    this.addListener("resize", this._onUpdate);

    // Stop events
    this.addListener("contextmenu", this._onStopEvent);
    this.addListener("tap", this._onStopEvent);
    this.addListener("dbltap", this._onStopEvent);

    // Initialize orientation
    if (orientation != null) {
      this.setOrientation(orientation);
    } else {
      this.initOrientation();
    }
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events : {
    /**
     * Change event for the value.
     */
    changeValue: 'qx.event.type.Data',

    /** Fired as soon as the slide animation ended. */
    slideAnimationEnd: 'qx.event.type.Event'
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "slider"
    },


    // overridden
    focusable :
    {
      refine : true,
      init : true
    },


    /** Whether the slider is horizontal or vertical. */
    orientation :
    {
      check : [ "horizontal", "vertical" ],
      init : "horizontal",
      apply : "_applyOrientation"
    },


    /**
     * The current slider value.
     *
     * Strictly validates according to {@link #minimum} and {@link #maximum}.
     * Do not apply any value correction to the incoming value. If you depend
     * on this, please use {@link #slideTo} instead.
     */
    value :
    {
      check : "typeof value==='number'&&value>=this.getMinimum()&&value<=this.getMaximum()",
      init : 0,
      apply : "_applyValue",
      nullable: true
    },


    /**
     * The minimum slider value (may be negative). This value must be smaller
     * than {@link #maximum}.
     */
    minimum :
    {
      check : "Integer",
      init : 0,
      apply : "_applyMinimum",
      event: "changeMinimum"
    },


    /**
     * The maximum slider value (may be negative). This value must be larger
     * than {@link #minimum}.
     */
    maximum :
    {
      check : "Integer",
      init : 100,
      apply : "_applyMaximum",
      event : "changeMaximum"
    },


    /**
     * The amount to increment on each event. Typically corresponds
     * to the user pressing an arrow key.
     */
    singleStep :
    {
      check : "Integer",
      init : 1
    },


    /**
     * The amount to increment on each event. Typically corresponds
     * to the user pressing <code>PageUp</code> or <code>PageDown</code>.
     */
    pageStep :
    {
      check : "Integer",
      init : 10
    },


    /**
     * Factor to apply to the width/height of the knob in relation
     * to the dimension of the underlying area.
     */
    knobFactor :
    {
      check : "Number",
      apply : "_applyKnobFactor",
      nullable : true
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    __sliderLocation : null,
    __knobLocation : null,
    __knobSize : null,
    __dragMode : null,
    __dragOffset : null,
    __trackingMode : null,
    __trackingDirection : null,
    __trackingEnd : null,
    __timer : null,

    // event delay stuff during drag
    __dragTimer: null,
    __lastValueEvent: null,
    __dragValue: null,

    __scrollAnimationframe : null,


    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates : {
      invalid : true
    },


    // overridden
    renderLayout : function(left, top, width, height) {
      this.base(arguments, left, top, width, height);
      // make sure the layout engine does not override the knob position
      this._updateKnobPosition();
    },


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "knob":
          control = new qx.ui.core.Widget();

          control.addListener("resize", this._onUpdate, this);
          control.addListener("pointerover", this._onPointerOver);
          control.addListener("pointerout", this._onPointerOut);
          this._add(control);
          break;
      }

      return control || this.base(arguments, id);
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER
    ---------------------------------------------------------------------------
    */


    /**
     * Event handler for pointerover events at the knob child control.
     *
     * Adds the 'hovered' state
     *
     * @param e {qx.event.type.Pointer} Incoming pointer event
     */
    _onPointerOver : function(e) {
      this.addState("hovered");
    },


    /**
     * Event handler for pointerout events at the knob child control.
     *
     * Removes the 'hovered' state
     *
     * @param e {qx.event.type.Pointer} Incoming pointer event
     */
    _onPointerOut : function(e) {
      this.removeState("hovered");
    },


    /**
     * Listener of roll event
     *
     * @param e {qx.event.type.Roll} Incoming event object
     */
    _onRoll : function(e)
    {
      // only wheel
      if (e.getPointerType() != "wheel") {
        return;
      }

      var axis = this.getOrientation() === "horizontal" ? "x" : "y";
      var delta = e.getDelta()[axis];

      var direction =  delta > 0 ? 1 : delta < 0 ? -1 : 0;
      this.slideBy(direction * this.getSingleStep());

      e.stop();
    },


    /**
     * Event handler for keypress events.
     *
     * Adds support for arrow keys, page up, page down, home and end keys.
     *
     * @param e {qx.event.type.KeySequence} Incoming keypress event
     */
    _onKeyPress : function(e)
    {
      var isHorizontal = this.getOrientation() === "horizontal";
      var backward = isHorizontal ? "Left" : "Up";
      var forward = isHorizontal ? "Right" : "Down";

      switch(e.getKeyIdentifier())
      {
        case forward:
          this.slideForward();
          break;

        case backward:
          this.slideBack();
          break;

        case "PageDown":
          this.slidePageForward(100);
          break;

        case "PageUp":
          this.slidePageBack(100);
          break;

        case "Home":
          this.slideToBegin(200);
          break;

        case "End":
          this.slideToEnd(200);
          break;

        default:
          return;
      }

      // Stop processed events
      e.stop();
    },


    /**
     * Listener of pointerdown event. Initializes drag or tracking mode.
     *
     * @param e {qx.event.type.Pointer} Incoming event object
     */
    _onPointerDown : function(e)
    {
      // this can happen if the user releases the button while dragging outside
      // of the browser viewport
      if (this.__dragMode) {
        return;
      }

      var isHorizontal = this.__isHorizontal;
      var knob = this.getChildControl("knob");

      var locationProperty = isHorizontal ? "left" : "top";

      var cursorLocation = isHorizontal ? e.getDocumentLeft() : e.getDocumentTop();

      var decorator = this.getDecorator();
      decorator = qx.theme.manager.Decoration.getInstance().resolve(decorator);
      if (isHorizontal) {
        var decoratorPadding = decorator ? decorator.getInsets().left : 0;
        var padding = (this.getPaddingLeft() || 0) + decoratorPadding;
      } else {
        var decoratorPadding = decorator ? decorator.getInsets().top : 0;
        var padding = (this.getPaddingTop() || 0) + decoratorPadding;
      }

      var sliderLocation = this.__sliderLocation = qx.bom.element.Location.get(this.getContentElement().getDomElement())[locationProperty];
      sliderLocation += padding;

      var knobLocation = this.__knobLocation = qx.bom.element.Location.get(knob.getContentElement().getDomElement())[locationProperty];

      if (e.getTarget() === knob)
      {
        // Switch into drag mode
        this.__dragMode = true;
        if (!this.__dragTimer){
          // create a timer to fire delayed dragging events if dragging stops.
          this.__dragTimer = new qx.event.Timer(100);
          this.__dragTimer.addListener("interval", this._fireValue, this);
        }
        this.__dragTimer.start();
        // Compute dragOffset (includes both: inner position of the widget and
        // cursor position on knob)
        this.__dragOffset = cursorLocation + sliderLocation - knobLocation;

        // add state
        knob.addState("pressed");
      }
      else
      {
        // Switch into tracking mode
        this.__trackingMode = true;

        // Detect tracking direction
        this.__trackingDirection = cursorLocation <= knobLocation ? -1 : 1;

        // Compute end value
        this.__computeTrackingEnd(e);

        // Directly call interval method once
        this._onInterval();

        // Initialize timer (when needed)
        if (!this.__timer)
        {
          this.__timer = new qx.event.Timer(100);
          this.__timer.addListener("interval", this._onInterval, this);
        }

        // Start timer
        this.__timer.start();
      }

      // Register move listener
      this.addListener("pointermove", this._onPointerMove);

      // Activate capturing
      this.capture();

      // Stop event
      e.stopPropagation();
    },


    /**
     * Listener of pointerup event. Used for cleanup of previously
     * initialized modes.
     *
     * @param e {qx.event.type.Pointer} Incoming event object
     */
    _onPointerUp : function(e)
    {
      if (this.__dragMode)
      {
        // Release capture mode
        this.releaseCapture();

        // Cleanup status flags
        delete this.__dragMode;

        // as we come out of drag mode, make
        // sure content gets synced
        this.__dragTimer.stop();
        this._fireValue();

        delete this.__dragOffset;

        // remove state
        this.getChildControl("knob").removeState("pressed");

        // it's necessary to check whether the cursor is over the knob widget to be able to
        // to decide whether to remove the 'hovered' state.
        if (e.getType() === "pointerup")
        {
          var deltaSlider;
          var deltaPosition;
          var positionSlider;

          if (this.__isHorizontal)
          {
            deltaSlider = e.getDocumentLeft() - (this._valueToPosition(this.getValue()) + this.__sliderLocation);

            positionSlider = qx.bom.element.Location.get(this.getContentElement().getDomElement())["top"];
            deltaPosition = e.getDocumentTop() - (positionSlider + this.getChildControl("knob").getBounds().top);
          }
          else
          {
            deltaSlider = e.getDocumentTop() - (this._valueToPosition(this.getValue()) + this.__sliderLocation);

            positionSlider = qx.bom.element.Location.get(this.getContentElement().getDomElement())["left"];
            deltaPosition = e.getDocumentLeft() - (positionSlider + this.getChildControl("knob").getBounds().left);
          }

          if (deltaPosition < 0 || deltaPosition > this.__knobSize ||
              deltaSlider < 0 || deltaSlider > this.__knobSize) {
            this.getChildControl("knob").removeState("hovered");
          }
        }

      }
      else if (this.__trackingMode)
      {
        // Stop timer interval
        this.__timer.stop();

        // Release capture mode
        this.releaseCapture();

        // Cleanup status flags
        delete this.__trackingMode;
        delete this.__trackingDirection;
        delete this.__trackingEnd;
      }

      // Remove move listener again
      this.removeListener("pointermove", this._onPointerMove);

      // Stop event
      if (e.getType() === "pointerup") {
        e.stopPropagation();
      }
    },


    /**
     * Listener of pointermove event for the knob. Only used in drag mode.
     *
     * @param e {qx.event.type.Pointer} Incoming event object
     */
    _onPointerMove : function(e)
    {
      if (this.__dragMode)
      {
        var dragStop = this.__isHorizontal ?
          e.getDocumentLeft() : e.getDocumentTop();
        var position = dragStop - this.__dragOffset;

        this.slideTo(this._positionToValue(position));
      }
      else if (this.__trackingMode)
      {
        // Update tracking end on pointermove
        this.__computeTrackingEnd(e);
      }

      // Stop event
      e.stopPropagation();
    },


    /**
     * Listener of interval event by the internal timer. Only used
     * in tracking sequences.
     *
     * @param e {qx.event.type.Event} Incoming event object
     */
    _onInterval : function(e)
    {
      // Compute new value
      var value = this.getValue() + (this.__trackingDirection * this.getPageStep());

      // Limit value
      if (value < this.getMinimum()) {
        value = this.getMinimum();
      } else if (value > this.getMaximum()) {
        value = this.getMaximum();
      }

      // Stop at tracking position (where the pointer is pressed down)
      var slideBack = this.__trackingDirection == -1;
      if ((slideBack && value <= this.__trackingEnd) || (!slideBack && value >= this.__trackingEnd)) {
        value = this.__trackingEnd;
      }

      // Finally slide to the desired position
      this.slideTo(value);
    },


    /**
     * Listener of resize event for both the slider itself and the knob.
     *
     * @param e {qx.event.type.Data} Incoming event object
     */
    _onUpdate : function(e)
    {
      // Update sliding space
      var availSize = this.getInnerSize();
      var knobSize = this.getChildControl("knob").getBounds();
      var sizeProperty = this.__isHorizontal ? "width" : "height";

      // Sync knob size
      this._updateKnobSize();

      // Store knob size
      this.__slidingSpace = availSize[sizeProperty] - knobSize[sizeProperty];
      this.__knobSize = knobSize[sizeProperty];

      // Update knob position (sliding space must be updated first)
      this._updateKnobPosition();
    },






    /*
    ---------------------------------------------------------------------------
      UTILS
    ---------------------------------------------------------------------------
    */

    /** @type {Boolean} Whether the slider is laid out horizontally */
    __isHorizontal : false,


    /**
     * @type {Integer} Available space for knob to slide on, computed on resize of
     * the widget
     */
    __slidingSpace : 0,


    /**
     * Computes the value where the tracking should end depending on
     * the current pointer position.
     *
     * @param e {qx.event.type.Pointer} Incoming pointer event
     */
    __computeTrackingEnd : function(e)
    {
      var isHorizontal = this.__isHorizontal;
      var cursorLocation = isHorizontal ? e.getDocumentLeft() : e.getDocumentTop();
      var sliderLocation = this.__sliderLocation;
      var knobLocation = this.__knobLocation;
      var knobSize = this.__knobSize;

      // Compute relative position
      var position = cursorLocation - sliderLocation;
      if (cursorLocation >= knobLocation) {
        position -= knobSize;
      }

      // Compute stop value
      var value = this._positionToValue(position);

      var min = this.getMinimum();
      var max = this.getMaximum();

      if (value < min) {
        value = min;
      } else if (value > max) {
        value = max;
      } else {
        var old = this.getValue();
        var step = this.getPageStep();
        var method = this.__trackingDirection < 0 ? "floor" : "ceil";

        // Fix to page step
        value = old + (Math[method]((value - old) / step) * step);
      }

      // Store value when undefined, otherwise only when it follows the
      // current direction e.g. goes up or down
      if (this.__trackingEnd == null || (this.__trackingDirection == -1 && value <= this.__trackingEnd) || (this.__trackingDirection == 1 && value >= this.__trackingEnd)) {
        this.__trackingEnd = value;
      }
    },


    /**
     * Converts the given position to a value.
     *
     * Does not respect single or page step.
     *
     * @param position {Integer} Position to use
     * @return {Integer} Resulting value (rounded)
     */
    _positionToValue : function(position)
    {
      // Reading available space
      var avail = this.__slidingSpace;

      // Protect undefined value (before initial resize) and division by zero
      if (avail == null || avail == 0) {
        return 0;
      }

      // Compute and limit percent
      var percent = position / avail;
      if (percent < 0) {
        percent = 0;
      } else if (percent > 1) {
        percent = 1;
      }

      // Compute range
      var range = this.getMaximum() - this.getMinimum();

      // Compute value
      return this.getMinimum() + Math.round(range * percent);
    },


    /**
     * Converts the given value to a position to place
     * the knob to.
     *
     * @param value {Integer} Value to use
     * @return {Integer} Computed position (rounded)
     */
    _valueToPosition : function(value)
    {
      // Reading available space
      var avail = this.__slidingSpace;
      if (avail == null) {
        return 0;
      }

      // Computing range
      var range = this.getMaximum() - this.getMinimum();

      // Protect division by zero
      if (range == 0) {
        return 0;
      }

      // Translating value to distance from minimum
      var value = value - this.getMinimum();

      // Compute and limit percent
      var percent = value / range;
      if (percent < 0) {
        percent = 0;
      } else if (percent > 1) {
        percent = 1;
      }

      // Compute position from available space and percent
      return Math.round(avail * percent);
    },


    /**
     * Updates the knob position following the currently configured
     * value. Useful on reflows where the dimensions of the slider
     * itself have been modified.
     *
     */
    _updateKnobPosition : function() {
      this._setKnobPosition(this._valueToPosition(this.getValue()));
    },


    /**
     * Moves the knob to the given position.
     *
     * @param position {Integer} Any valid position (needs to be
     *   greater or equal than zero)
     */
    _setKnobPosition : function(position)
    {
      // Use the DOM Element to prevent unnecessary layout recalculations
      var knob = this.getChildControl("knob");
      var dec = this.getDecorator();
      dec = qx.theme.manager.Decoration.getInstance().resolve(dec);
      var content = knob.getContentElement();
      if (this.__isHorizontal) {
        if (dec && dec.getPadding()) {
          position += dec.getPadding().left;
        }
        position += this.getPaddingLeft() || 0;
        content.setStyle("left", position+"px", true);
      } else {
        if (dec && dec.getPadding()) {
          position += dec.getPadding().top;
        }
        position += this.getPaddingTop() || 0;
        content.setStyle("top", position+"px", true);
      }
    },


    /**
     * Reconfigures the size of the knob depending on
     * the optionally defined {@link #knobFactor}.
     *
     */
    _updateKnobSize : function()
    {
      // Compute knob size
      var knobFactor = this.getKnobFactor();
      if (knobFactor == null) {
        return;
      }

      // Ignore when not rendered yet
      var avail = this.getInnerSize();
      if (avail == null) {
        return;
      }

      // Read size property
      if (this.__isHorizontal) {
        this.getChildControl("knob").setWidth(Math.round(knobFactor * avail.width));
      } else {
        this.getChildControl("knob").setHeight(Math.round(knobFactor * avail.height));
      }
    },





    /*
    ---------------------------------------------------------------------------
      SLIDE METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Slides backward to the minimum value
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    slideToBegin : function(duration) {
      this.slideTo(this.getMinimum(), duration);
    },


    /**
     * Slides forward to the maximum value
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    slideToEnd : function(duration) {
      this.slideTo(this.getMaximum(), duration);
    },


    /**
     * Slides forward (right or bottom depending on orientation)
     *
     */
    slideForward : function() {
      this.slideBy(this.getSingleStep());
    },


    /**
     * Slides backward (to left or top depending on orientation)
     *
     */
    slideBack : function() {
      this.slideBy(-this.getSingleStep());
    },


    /**
     * Slides a page forward (to right or bottom depending on orientation)
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    slidePageForward : function(duration) {
      this.slideBy(this.getPageStep(), duration);
    },


    /**
     * Slides a page backward (to left or top depending on orientation)
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    slidePageBack : function(duration) {
      this.slideBy(-this.getPageStep(), duration);
    },


    /**
     * Slides by the given offset.
     *
     * This method works with the value, not with the coordinate.
     *
     * @param offset {Integer} Offset to scroll by
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    slideBy : function(offset, duration) {
      this.slideTo(this.getValue() + offset, duration);
    },


    /**
     * Slides to the given value
     *
     * This method works with the value, not with the coordinate.
     *
     * @param value {Integer} Scroll to a value between the defined
     *   minimum and maximum.
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    slideTo : function(value, duration)
    {
      this.stopSlideAnimation();

      if (duration) {
        this.__animateTo(value, duration);
      } else {
        this.updatePosition(value);
      }
    },


    /**
     * Updates the position property considering the minimum and maximum values.
     * @param value {Number} The new position.
     */
    updatePosition : function(value) {
      this.setValue(this.__normalizeValue(value));
    },


    /**
     * In case a slide animation is currently running, it will be stopped.
     * If not, the method does nothing.
     */
    stopSlideAnimation : function() {
      if (this.__scrollAnimationframe) {
        this.__scrollAnimationframe.cancelSequence();
        this.__scrollAnimationframe = null;
      }
    },


    /**
     * Internal helper to normalize the given value concerning the minimum
     * and maximum value.
     * @param value {Number} The value to normalize.
     * @return {Number} The normalized value.
     */
    __normalizeValue : function(value) {
      // Bring into allowed range or fix to single step grid
      if (value < this.getMinimum()) {
        value = this.getMinimum();
      } else if (value > this.getMaximum()) {
        value = this.getMaximum();
      } else {
        value = this.getMinimum() + Math.round((value - this.getMinimum()) / this.getSingleStep()) * this.getSingleStep()
      }
      return value;
    },


    /**
     * Animation helper which takes care of the animated slide.
     * @param to {Number} The target value.
     * @param duration {Number} The time in milliseconds the slide to should take.
     */
    __animateTo : function(to, duration) {
      to = this.__normalizeValue(to);
      var from = this.getValue();

      this.__scrollAnimationframe = new qx.bom.AnimationFrame();

      this.__scrollAnimationframe.on("frame", function(timePassed) {
        this.setValue(parseInt(timePassed/duration * (to - from) + from));
      }, this);

      this.__scrollAnimationframe.on("end", function() {
        this.setValue(to);
        this.__scrollAnimationframe = null;
        this.fireEvent("slideAnimationEnd");
      }, this);

      this.__scrollAnimationframe.startSequence(duration);
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyOrientation : function(value, old)
    {
      var knob = this.getChildControl("knob");

      // Update private flag for faster access
      this.__isHorizontal = value === "horizontal";

      // Toggle states and knob layout
      if (this.__isHorizontal)
      {
        this.removeState("vertical");
        knob.removeState("vertical");

        this.addState("horizontal");
        knob.addState("horizontal");

        knob.setLayoutProperties({top:0, right:null, bottom:0});
      }
      else
      {
        this.removeState("horizontal");
        knob.removeState("horizontal");

        this.addState("vertical");
        knob.addState("vertical");

        knob.setLayoutProperties({right:0, bottom:null, left:0});
      }

      // Sync knob position
      this._updateKnobPosition();
    },


    // property apply
    _applyKnobFactor : function(value, old)
    {
      if (value != null)
      {
        this._updateKnobSize();
      }
      else
      {
        if (this.__isHorizontal) {
          this.getChildControl("knob").resetWidth();
        } else {
          this.getChildControl("knob").resetHeight();
        }
      }
    },


    // property apply
    _applyValue : function(value, old) {
      if (value != null) {
        this._updateKnobPosition();
        if (this.__dragMode) {
          this.__dragValue = [value,old];
        } else {
          this.fireEvent("changeValue", qx.event.type.Data, [value,old]);
        }
      } else {
        this.resetValue();
      }
    },


    /**
     * Helper for applyValue which fires the changeValue event.
     */
    _fireValue: function(){
      if (!this.__dragValue){
        return;
      }
      var tmp = this.__dragValue;
      this.__dragValue = null;
      this.fireEvent("changeValue", qx.event.type.Data, tmp);
    },


    // property apply
    _applyMinimum : function(value, old)
    {
      if (this.getValue() < value) {
        this.setValue(value);
      }

      this._updateKnobPosition();
    },


    // property apply
    _applyMaximum : function(value, old)
    {
      if (this.getValue() > value) {
        this.setValue(value);
      }

      this._updateKnobPosition();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The Canvas is an extended Basic layout.
 *
 * It is possible to position a widget relative to the right or bottom edge of
 * the available space. It further supports stretching between left and right
 * or top and bottom e.g. <code>left=20</code> and <code>right=20</code> would
 * keep a margin of 20 pixels to both edges. The Canvas layout has support for
 * percent dimensions and locations.
 *
 * *Features*
 *
 * * Pixel dimensions and locations
 * * Percent dimensions and locations
 * * Stretching between left+right and top+bottom
 * * Minimum and maximum dimensions
 * * Children are automatically shrunk to their minimum dimensions if not enough space is available
 * * Auto sizing (ignoring percent values)
 * * Margins (also negative ones)
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>left</strong> <em>(Integer|String)</em>: The left coordinate in pixel or as a percent string e.g. <code>20</code> or <code>30%</code>.</li>
 * <li><strong>top</strong> <em>(Integer|String)</em>: The top coordinate in pixel or as a percent string e.g. <code>20</code> or <code>30%</code>.</li>
 * <li><strong>right</strong> <em>(Integer|String)</em>: The right coordinate in pixel or as a percent string e.g. <code>20</code> or <code>30%</code>.</li>
 * <li><strong>bottom</strong> <em>(Integer|String)</em>: The bottom coordinate in pixel or as a percent string e.g. <code>20</code> or <code>30%</code>.</li>
 * <li><strong>edge</strong> <em>(Integer|String)</em>: The coordinate in pixels or as a percent string to be used for all four edges.
 * <li><strong>width</strong> <em>(String)</em>: A percent width e.g. <code>40%</code>.</li>
 * <li><strong>height</strong> <em>(String)</em>: A percent height e.g. <code>60%</code>.</li>
 * </ul>
 *
 * *Notes*
 *
 * <ul>
 * <li>Stretching (<code>left</code>-><code>right</code> or <code>top</code>-><code>bottom</code>)
 *   has a higher priority than the preferred dimensions</li>
 * <li>Stretching has a lower priority than the min/max dimensions.</li>
 * <li>Percent values have no influence on the size hint of the layout.</li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the canvas layout.
 *
 * <pre class="javascript">
 * var container = new qx.ui.container.Composite(new qx.ui.layout.Canvas());
 *
 * // simple positioning
 * container.add(new qx.ui.core.Widget(), {top: 10, left: 10});
 *
 * // stretch vertically with 10 pixel distance to the parent's top
 * // and bottom border
 * container.add(new qx.ui.core.Widget(), {top: 10, left: 10, bottom: 10});
 *
 * // percent positioning and size
 * container.add(new qx.ui.core.Widget(), {left: "50%", top: "50%", width: "25%", height: "40%"});
 * </pre>
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/canvas.html'>
 * Extended documentation</a> and links to demos of this layout in the qooxdoo manual.
 */
qx.Class.define("qx.ui.layout.Canvas",
{
  extend : qx.ui.layout.Abstract,




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties : {

    /**
     * If desktop mode is active, the children's minimum sizes are ignored
     * by the layout calculation. This is necessary to prevent the desktop
     * from growing if e.g. a window is moved beyond the edge of the desktop
     */
    desktop :
    {
      check : "Boolean",
      init: false
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        var layoutProperties =
        {
          top : 1,
          left : 1,
          bottom : 1,
          right : 1,
          width : 1,
          height : 1,
          edge : 1
        };

        this.assert(layoutProperties[name] == 1, "The property '"+name+"' is not supported by the Canvas layout!");

        if (name =="width" || name == "height")
        {
          this.assertMatch(value, qx.ui.layout.Util.PERCENT_VALUE);
        }
        else
        {
          if (typeof value === "number") {
            this.assertInteger(value);
          } else if (qx.lang.Type.isString(value)) {
            this.assertMatch(value, qx.ui.layout.Util.PERCENT_VALUE);
          } else {
            this.fail(
              "Bad format of layout property '" + name + "': " + value +
              ". The value must be either an integer or an percent string."
            );
          }
        }
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      var children = this._getLayoutChildren();

      var child, size, props;
      var left, top, right, bottom, width, height;
      var marginTop, marginRight, marginBottom, marginLeft;

      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        size = child.getSizeHint();
        props = child.getLayoutProperties();

        // Cache margins
        marginTop = child.getMarginTop();
        marginRight = child.getMarginRight();
        marginBottom = child.getMarginBottom();
        marginLeft = child.getMarginLeft();



        // **************************************
        //   Processing location
        // **************************************

        left = props.left != null ? props.left : props.edge;
        if (qx.lang.Type.isString(left)) {
          left = Math.round(parseFloat(left) * availWidth / 100);
        }

        right = props.right != null ? props.right : props.edge;
        if (qx.lang.Type.isString(right)) {
          right = Math.round(parseFloat(right) * availWidth / 100);
        }

        top = props.top != null ? props.top : props.edge;
        if (qx.lang.Type.isString(top)) {
          top = Math.round(parseFloat(top) * availHeight / 100);
        }

        bottom = props.bottom != null ? props.bottom : props.edge;
        if (qx.lang.Type.isString(bottom)) {
          bottom = Math.round(parseFloat(bottom) * availHeight / 100);
        }



        // **************************************
        //   Processing dimension
        // **************************************

        // Stretching has higher priority than dimension data
        if (left != null && right != null)
        {
          width = availWidth - left - right - marginLeft - marginRight;

          // Limit computed value
          if (width < size.minWidth) {
            width = size.minWidth;
          } else if (width > size.maxWidth) {
            width = size.maxWidth;
          }

          // Add margin
          left += marginLeft;
        }
        else
        {
          // Layout data has higher priority than data from size hint
          width = props.width;

          if (width == null)
          {
            width = size.width;
          }
          else
          {
            width = Math.round(parseFloat(width) * availWidth / 100);

            // Limit computed value
            if (width < size.minWidth) {
              width = size.minWidth;
            } else if (width > size.maxWidth) {
              width = size.maxWidth;
            }
          }

          if (right != null) {
            left = availWidth - width - right - marginRight - marginLeft;
          } else if (left == null) {
            left = marginLeft;
          } else {
            left += marginLeft;
          }
        }

        // Stretching has higher priority than dimension data
        if (top != null && bottom != null)
        {
          height = availHeight - top - bottom - marginTop - marginBottom;

          // Limit computed value
          if (height < size.minHeight) {
            height = size.minHeight;
          } else if (height > size.maxHeight) {
            height = size.maxHeight;
          }

          // Add margin
          top += marginTop;
        }
        else
        {
          // Layout data has higher priority than data from size hint
          height = props.height;

          if (height == null)
          {
            height = size.height;
          }
          else
          {
            height = Math.round(parseFloat(height) * availHeight / 100);

            // Limit computed value
            if (height < size.minHeight) {
              height = size.minHeight;
            } else if (height > size.maxHeight) {
              height = size.maxHeight;
            }
          }

          if (bottom != null) {
            top = availHeight - height - bottom - marginBottom - marginTop;
          } else if (top == null) {
            top = marginTop;
          } else {
            top += marginTop;
          }
        }

        left += padding.left;
        top += padding.top;

        // Apply layout
        child.renderLayout(left, top, width, height);
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      var neededWidth=0, neededMinWidth=0;
      var neededHeight=0, neededMinHeight=0;

      var width, minWidth;
      var height, minHeight;

      var children = this._getLayoutChildren();
      var child, props, hint;
      var desktop = this.isDesktop();

      var left, top, right, bottom;

      for (var i=0,l=children.length; i<l; i++)
      {
        child = children[i];
        props = child.getLayoutProperties();
        hint = child.getSizeHint();


        // Cache margins
        var marginX = child.getMarginLeft() + child.getMarginRight();
        var marginY = child.getMarginTop() + child.getMarginBottom();


        // Compute width
        width = hint.width+marginX;
        minWidth = hint.minWidth+marginX;

        left = props.left != null ? props.left : props.edge;
        if (left && typeof left === "number")
        {
          width += left;
          minWidth += left;
        }

        right = props.right != null ? props.right : props.edge;
        if (right && typeof right === "number")
        {
          width += right;
          minWidth += right;
        }

        neededWidth = Math.max(neededWidth, width);
        neededMinWidth = desktop ? 0 : Math.max(neededMinWidth, minWidth);


        // Compute height
        height = hint.height+marginY;
        minHeight = hint.minHeight+marginY;

        top = props.top != null ? props.top : props.edge;
        if (top && typeof top === "number")
        {
          height += top;
          minHeight += top;
        }

        bottom = props.bottom != null ? props.bottom : props.edge;
        if (bottom && typeof bottom === "number")
        {
          height += bottom;
          minHeight += bottom;
        }

        neededHeight = Math.max(neededHeight, height);
        neededMinHeight = desktop ? 0 : Math.max(neededMinHeight, minHeight);
      }

      return {
        width : neededWidth,
        minWidth : neededMinWidth,
        height : neededHeight,
        minHeight : neededMinHeight
      };
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Minimal modified version of the {@link qx.ui.form.Slider} to be
 * used by {@link qx.ui.core.scroll.ScrollBar}.
 *
 * @internal
 */
qx.Class.define("qx.ui.core.scroll.ScrollSlider",
{
  extend : qx.ui.form.Slider,

  // overridden
  construct : function(orientation)
  {
    this.base(arguments, orientation);

    // Remove roll/keypress events
    this.removeListener("keypress", this._onKeyPress);
    this.removeListener("roll", this._onRoll);
  },


  members : {
    // overridden
    getSizeHint : function(compute) {
      // get the original size hint
      var hint = this.base(arguments);
      // set the width or height to 0 depending on the orientation.
      // this is necessary to prevent the ScrollSlider to change the size
      // hint of its parent, which can cause errors on outer flex layouts
      // [BUG #3279]
      if (this.getOrientation() === "horizontal") {
        hint.width = 0;
      } else {
        hint.height = 0;
      }
      return hint;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The scroll bar widget wraps the native browser scroll bars as a qooxdoo widget.
 * It can be uses instead of the styled qooxdoo scroll bars.
 *
 * Scroll bars are used by the {@link qx.ui.container.Scroll} container. Usually
 * a scroll bar is not used directly.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var scrollBar = new qx.ui.core.scroll.NativeScrollBar("horizontal");
 *   scrollBar.set({
 *     maximum: 500
 *   })
 *   this.getRoot().add(scrollBar);
 * </pre>
 *
 * This example creates a horizontal scroll bar with a maximum value of 500.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/scrollbar.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.core.scroll.NativeScrollBar",
{
  extend : qx.ui.core.Widget,
  implement : qx.ui.core.scroll.IScrollBar,


  /**
   * @param orientation {String?"horizontal"} The initial scroll bar orientation
   */
  construct : function(orientation)
  {
    this.base(arguments);

    this.addState("native");

    this.getContentElement().addListener("scroll", this._onScroll, this);
    this.addListener("pointerdown", this._stopPropagation, this);
    this.addListener("pointerup", this._stopPropagation, this);
    this.addListener("pointermove", this._stopPropagation, this);
    this.addListener("appear", this._onAppear, this);

    this.getContentElement().add(this._getScrollPaneElement());
    this.getContentElement().setStyle("box-sizing", "content-box");

    // Configure orientation
    if (orientation != null) {
      this.setOrientation(orientation);
    } else {
      this.initOrientation();
    }

    // prevent drag & drop on scrolling
    this.addListener("track", function(e) {
      e.stopPropagation();
    }, this);
  },


  events : {
    /**
     * Fired as soon as the scroll animation ended.
     */
    scrollAnimationEnd: 'qx.event.type.Event'
  },


  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "scrollbar"
    },


    // interface implementation
    orientation :
    {
      check : [ "horizontal", "vertical" ],
      init : "horizontal",
      apply : "_applyOrientation"
    },


    // interface implementation
    maximum :
    {
      check : "PositiveInteger",
      apply : "_applyMaximum",
      init : 100
    },


    // interface implementation
    position :
    {
      check : "Number",
      init : 0,
      apply : "_applyPosition",
      event : "scroll"
    },


    /**
     * Step size for each tap on the up/down or left/right buttons.
     */
    singleStep :
    {
      check : "Integer",
      init : 20
    },


    // interface implementation
    knobFactor :
    {
      check : "PositiveNumber",
      nullable : true
    }
  },


  members :
  {
    __isHorizontal : null,
    __scrollPaneElement : null,
    __requestId : null,

    __scrollAnimationframe : null,


    /**
     * Get the scroll pane html element.
     *
     * @return {qx.html.Element} The element
     */
    _getScrollPaneElement : function()
    {
      if (!this.__scrollPaneElement) {
        this.__scrollPaneElement = new qx.html.Element();
      }
      return this.__scrollPaneElement;
    },

    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    // overridden
    renderLayout : function(left, top, width, height)
    {
      var changes = this.base(arguments, left, top, width, height);

      this._updateScrollBar();
      return changes;
    },


    // overridden
    _getContentHint : function()
    {
      var scrollbarWidth = qx.bom.element.Scroll.getScrollbarWidth();
      return {
        width: this.__isHorizontal ? 100 : scrollbarWidth,
        maxWidth: this.__isHorizontal ? null : scrollbarWidth,
        minWidth: this.__isHorizontal ? null : scrollbarWidth,
        height: this.__isHorizontal ? scrollbarWidth : 100,
        maxHeight: this.__isHorizontal ? scrollbarWidth : null,
        minHeight: this.__isHorizontal ? scrollbarWidth : null
      }
    },


    // overridden
    _applyEnabled : function(value, old)
    {
      this.base(arguments, value, old);
      this._updateScrollBar();
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyMaximum : function(value) {
      this._updateScrollBar();
    },


    // property apply
    _applyPosition : function(value)
    {
      var content = this.getContentElement();

      if (this.__isHorizontal) {
        content.scrollToX(value)
      } else {
        content.scrollToY(value);
      }
    },


    // property apply
    _applyOrientation : function(value, old)
    {
      var isHorizontal = this.__isHorizontal = value === "horizontal";

      this.set({
        allowGrowX : isHorizontal,
        allowShrinkX : isHorizontal,
        allowGrowY : !isHorizontal,
        allowShrinkY : !isHorizontal
      });

      if (isHorizontal) {
        this.replaceState("vertical", "horizontal");
      } else {
        this.replaceState("horizontal", "vertical");
      }

      this.getContentElement().setStyles({
        overflowX: isHorizontal ? "scroll" : "hidden",
        overflowY: isHorizontal ? "hidden" : "scroll"
      });

      // Update layout
      qx.ui.core.queue.Layout.add(this);
    },


    /**
     * Update the scroll bar according to its current size, max value and
     * enabled state.
     */
    _updateScrollBar : function()
    {
      var isHorizontal = this.__isHorizontal;

      var bounds = this.getBounds();
      if (!bounds) {
        return;
      }

      if (this.isEnabled())
      {
        var containerSize = isHorizontal ? bounds.width : bounds.height;
        var innerSize = this.getMaximum() + containerSize;
      } else {
        innerSize = 0;
      }

      // Scrollbars don't work properly in IE if the element with overflow has
      // excatly the size of the scrollbar. Thus we move the element one pixel
      // out of the view and increase the size by one.
      if (qx.core.Environment.get("engine.name") == "mshtml")
      {
        var bounds = this.getBounds();
        this.getContentElement().setStyles({
          left: (isHorizontal ? bounds.left : (bounds.left -1)) + "px",
          top: (isHorizontal ? (bounds.top - 1) : bounds.top) + "px",
          width: (isHorizontal ? bounds.width : bounds.width + 1) + "px",
          height: (isHorizontal ? bounds.height + 1 : bounds.height) + "px"
        });
      }

      this._getScrollPaneElement().setStyles({
        left: 0,
        top: 0,
        width: (isHorizontal ? innerSize : 1) + "px",
        height: (isHorizontal ? 1 : innerSize) + "px"
      });

      this.updatePosition(this.getPosition());
    },


    // interface implementation
    scrollTo : function(position, duration) {
      // if a user sets a new position, stop any animation
      this.stopScrollAnimation();

      if (duration) {
        var from = this.getPosition();

        this.__scrollAnimationframe = new qx.bom.AnimationFrame();

        this.__scrollAnimationframe.on("frame", function(timePassed) {
          var newPos = parseInt(timePassed/duration * (position - from) + from);
          this.updatePosition(newPos);
        }, this);

        this.__scrollAnimationframe.on("end", function() {
          this.setPosition(Math.max(0, Math.min(this.getMaximum(), position)));
          this.__scrollAnimationframe = null;
          this.fireEvent("scrollAnimationEnd");
        }, this);

        this.__scrollAnimationframe.startSequence(duration);
      } else {
        this.updatePosition(position);
      }
    },


    /**
     * Helper to set the new position taking care of min and max values.
     * @param position {Number} The new position.
     */
    updatePosition : function(position) {
      this.setPosition(Math.max(0, Math.min(this.getMaximum(), position)));
    },


    // interface implementation
    scrollBy : function(offset, duration) {
      this.scrollTo(this.getPosition() + offset, duration)
    },


    // interface implementation
    scrollBySteps : function(steps, duration)
    {
      var size = this.getSingleStep();
      this.scrollBy(steps * size, duration);
    },


    /**
     * If a scroll animation is running, it will be stopped.
     */
    stopScrollAnimation : function() {
      if (this.__scrollAnimationframe) {
        this.__scrollAnimationframe.cancelSequence();
        this.__scrollAnimationframe = null;
      }
    },


    /**
     * Scroll event handler
     *
     * @param e {qx.event.type.Event} the scroll event
     */
    _onScroll : function(e)
    {
      var container = this.getContentElement();
      var position = this.__isHorizontal ? container.getScrollX() : container.getScrollY();
      this.setPosition(position);
    },


    /**
     * Listener for appear which ensured the scroll bar is positioned right
     * on appear.
     *
     * @param e {qx.event.type.Data} Incoming event object
     */
    _onAppear : function(e) {
      this._applyPosition(this.getPosition());
    },


    /**
     * Stops propagation on the given even
     *
     * @param e {qx.event.type.Event} the event
     */
    _stopPropagation : function(e) {
      e.stopPropagation();
    }
  },


  destruct : function() {
    this._disposeObjects("__scrollPaneElement");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2014 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin holding the handler for roll event. Please
 * keep in mind that the including widget has to have the scroll bars
 * implemented as child controls named <code>scrollbar-x</code> and
 * <code>scrollbar-y</code> to get the handler working. Also, you have to
 * attach the listener yourself.
 */
qx.Mixin.define("qx.ui.core.scroll.MRoll",
{
  members :
  {
    __cancelRoll : null,


    /**
     * Responsible for adding the event listener needed for scroll handling.
     */
    _addRollHandling : function() {
      this.addListener("roll", this._onRoll, this);
      this.addListener("pointerdown", this._onPointerDownForRoll, this);
    },


    /**
     * Responsible for removing the event listener needed for scroll handling.
     */
    _removeRollHandling : function() {
      this.removeListener("roll", this._onRoll, this);
      this.removeListener("pointerdown", this._onPointerDownForRoll, this);
    },


    /**
     * Handler for the pointerdown event which simply stops the momentum scrolling.
     *
     * @param e {qx.event.type.Pointer} pointerdown event
     */
    _onPointerDownForRoll : function(e) {
      this.__cancelRoll = e.getPointerId();
    },


    /**
     * Roll event handler
     *
     * @param e {qx.event.type.Roll} Roll event
     */
    _onRoll : function(e)
    {
      // only wheel and touch
      if (e.getPointerType() == "mouse") {
        return;
      }

      if (this.__cancelRoll && e.getMomentum()) {
        qx.event.Registration.getManager(e.getOriginalTarget())
          .getHandler(qx.event.handler.Gesture)
          .gestureCancel(this.__cancelRoll);

        e.stopMomentum();
        this.__cancelRoll = null;
        return;
      }
      this.__cancelRoll = null;

      var showX = this._isChildControlVisible("scrollbar-x");
      var showY = this._isChildControlVisible("scrollbar-y");

      var scrollbarY = showY ? this.getChildControl("scrollbar-y", true) : null;
      var scrollbarX = showX ? this.getChildControl("scrollbar-x", true) : null;

      var deltaY = e.getDelta().y;
      var deltaX = e.getDelta().x;

      var endY = !showY;
      var endX = !showX;

      // y case
      if (scrollbarY) {
        if (deltaY !== 0) {
          scrollbarY.scrollBy(parseInt(deltaY, 10));
        }

        var position = scrollbarY.getPosition();
        var max = scrollbarY.getMaximum();

        // pass the event to the parent if the scrollbar is at an edge
        if (deltaY < 0 && position <= 0 || deltaY > 0 && position >= max) {
          endY = true;
        }
      }

      // x case
      if (scrollbarX) {
        if (deltaX !== 0) {
          scrollbarX.scrollBy(parseInt(deltaX, 10));
        }

        var position = scrollbarX.getPosition();
        var max = scrollbarX.getMaximum();
        // pass the event to the parent if the scrollbar is at an edge
        if (deltaX < 0 && position <= 0 || deltaX > 0 && position >= max) {
          endX = true;
        }
      }

      if (endX && endY) {
        e.stopMomentum();
      }

      // pass the event to the parent if both scrollbars are at the end
      if ((!endY && deltaX === 0) ||
          (!endX && deltaY === 0) ||
          ((!endX || !endY ) && deltaX !== 0 && deltaY !== 0)) {
        // Stop bubbling and native event only if a scrollbar is visible
        e.stop();
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Richard Sternagel (rsternagel)

************************************************************************ */

/**
 * Provides scrolling ability during drag session to the widget.
 */
qx.Mixin.define("qx.ui.core.MDragDropScrolling",
{
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.addListener("drag", this.__onDrag, this);
    this.addListener("dragend", this.__onDragend, this);

    this.__xDirs = ["left", "right"];
    this.__yDirs = ["top", "bottom"];
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The threshold for the x-axis (in pixel) to activate scrolling at the edges. */
    dragScrollThresholdX :
    {
      check : "Integer",
      init : 30
    },

    /** The threshold for the y-axis (in pixel) to activate scrolling at the edges. */
    dragScrollThresholdY :
    {
      check : "Integer",
      init : 30
    },

    /** The factor for slowing down the scrolling. */
    dragScrollSlowDownFactor :
    {
      check : "Float",
      init : 0.1
    }
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __dragScrollTimer : null,
    __xDirs : null,
    __yDirs : null,

    /**
     * Finds the first scrollable parent (in the parent chain).
     *
     * @param widget {qx.ui.core.LayoutItem} The widget to start from.
     * @return {qx.ui.core.Widget} A scrollable widget.
     */
    _findScrollableParent : function(widget)
    {
      var cur = widget;
      if (cur === null) {
        return null;
      }

      while (cur.getLayoutParent()) {
        cur = cur.getLayoutParent();
        if (this._isScrollable(cur)) {
          return cur;
        }
      }
      return null;
    },

    /**
     * Whether the widget is scrollable.
     *
     * @param widget {qx.ui.core.Widget} The widget to check.
     * @return {Boolean} Whether the widget is scrollable.
     */
    _isScrollable : function(widget)
    {
      return qx.Class.hasMixin(widget.constructor, qx.ui.core.scroll.MScrollBarFactory);
    },

    /**
     * Gets the bounds of the given scrollable.
     *
     * @param scrollable {qx.ui.core.Widget} Scrollable which has scrollbar child controls.
     * @return {Map} A map with all four bounds (e.g. {"left":0, "top":20, "right":0, "bottom":80}).
     */
    _getBounds : function(scrollable)
    {
      var bounds = scrollable.getContentLocation();

      // the scrollable may dictate a nested widget for more precise bounds
      if (scrollable.getScrollAreaContainer) {
        bounds = scrollable.getScrollAreaContainer().getContentLocation();
      }

      return bounds;
    },

    /**
     * Gets the edge type or null if the pointer isn't within one of the thresholds.
     *
     * @param diff {Map} Difference map with all for edgeTypes.
     * @param thresholdX {Number} x-axis threshold.
     * @param thresholdY {Number} y-axis threshold.
     * @return {String} One of the four edgeTypes ('left', 'right', 'top', 'bottom').
     */
    _getEdgeType : function(diff, thresholdX, thresholdY)
    {
      if ((diff.left * -1) <= thresholdX && diff.left < 0) {
        return "left";
      } else if ((diff.top * -1) <= thresholdY && diff.top < 0) {
        return "top";
      } else if (diff.right <= thresholdX && diff.right > 0) {
        return "right";
      } else if (diff.bottom <= thresholdY && diff.bottom > 0) {
        return "bottom";
      } else {
        return null;
      }
    },

    /**
     * Gets the axis ('x' or 'y') by the edge type.
     *
     * @param edgeType {String} One of the four edgeTypes ('left', 'right', 'top', 'bottom').
     * @throws {Error} If edgeType is not one of the distinct four ones.
     * @return {String} Returns 'y' or 'x'.
     */
    _getAxis : function(edgeType)
    {
      if (this.__xDirs.indexOf(edgeType) !== -1) {
        return "x";
      } else if (this.__yDirs.indexOf(edgeType) !== -1) {
        return "y";
      } else {
        throw new Error("Invalid edge type given ("+edgeType+"). Must be: 'left', 'right', 'top' or 'bottom'");
      }
    },

    /**
     * Gets the threshold amount by edge type.
     *
     * @param edgeType {String} One of the four edgeTypes ('left', 'right', 'top', 'bottom').
     * @return {Number} The threshold of the x or y axis.
     */
    _getThresholdByEdgeType : function(edgeType) {
      if (this.__xDirs.indexOf(edgeType) !== -1) {
        return this.getDragScrollThresholdX();
      } else if(this.__yDirs.indexOf(edgeType) !== -1) {
        return this.getDragScrollThresholdY();
      }
    },

    /**
     * Whether the scrollbar is visible.
     *
     * @param scrollable {qx.ui.core.Widget} Scrollable which has scrollbar child controls.
     * @param axis {String} Can be 'y' or 'x'.
     * @return {Boolean} Whether the scrollbar is visible.
     */
    _isScrollbarVisible : function(scrollable, axis)
    {
      if (scrollable && scrollable._isChildControlVisible) {
        return scrollable._isChildControlVisible("scrollbar-"+axis);
      } else {
        return false;
      }
    },

    /**
     * Whether the scrollbar is exceeding it's maximum position.
     *
     * @param scrollbar {qx.ui.core.scroll.IScrollBar} Scrollbar to check.
     * @param axis {String} Can be 'y' or 'x'.
     * @param amount {Number} Amount to scroll which may be negative.
     * @return {Boolean} Whether the amount will exceed the scrollbar max position.
     */
    _isScrollbarExceedingMaxPos : function(scrollbar, axis, amount)
    {
      var newPos = 0;
      if (!scrollbar) {
        return true;
      }
      newPos = scrollbar.getPosition() + amount;
      return (newPos > scrollbar.getMaximum() || newPos < 0);
    },

    /**
     * Calculates the threshold exceedance (which may be negative).
     *
     * @param diff {Number} Difference value of one edgeType.
     * @param threshold {Number} x-axis or y-axis threshold.
     * @return {Number} Threshold exceedance amount (positive or negative).
     */
    _calculateThresholdExceedance : function(diff, threshold)
    {
      var amount = threshold - Math.abs(diff);
      return diff < 0 ? (amount * -1) : amount;
    },

    /**
     * Calculates the scroll amount (which may be negative).
     * The amount is influenced by the scrollbar size (bigger = faster)
     * the exceedanceAmount (bigger = faster) and the slowDownFactor.
     *
     * @param scrollbarSize {Number} Size of the scrollbar.
     * @param exceedanceAmount {Number} Threshold exceedance amount (positive or negative).
     * @return {Number} Scroll amount (positive or negative).
     */
    _calculateScrollAmount : function(scrollbarSize, exceedanceAmount)
    {
      return Math.floor(((scrollbarSize / 100) * exceedanceAmount) * this.getDragScrollSlowDownFactor());
    },

    /**
     * Scrolls the given scrollable on the given axis for the given amount.
     *
     * @param scrollable {qx.ui.core.Widget} Scrollable which has scrollbar child controls.
     * @param axis {String} Can be 'y' or 'x'.
     * @param exceedanceAmount {Number} Threshold exceedance amount (positive or negative).
     */
    _scrollBy : function(scrollable, axis, exceedanceAmount) {
      var scrollbar = scrollable.getChildControl("scrollbar-"+axis, true);
      if (!scrollbar) {
        return;
      }
      var bounds = scrollbar.getBounds(),
          scrollbarSize = axis === "x" ? bounds.width : bounds.height,
          amount = this._calculateScrollAmount(scrollbarSize, exceedanceAmount);

      if (this._isScrollbarExceedingMaxPos(scrollbar, axis, amount)) {
        this.__dragScrollTimer.stop();
      }

      scrollbar.scrollBy(amount);
    },

    /*
    ---------------------------------------------------------------------------
    EVENT HANDLERS
    ---------------------------------------------------------------------------
    */

    /**
     * Event handler for the drag event.
     *
     * @param e {qx.event.type.Drag} The drag event instance.
     */
    __onDrag : function(e)
    {
      if (this.__dragScrollTimer) {
        // stop last scroll action
        this.__dragScrollTimer.stop();
      }

      var scrollable = this._findScrollableParent(e.getOriginalTarget());

      if (scrollable) {
        var bounds = this._getBounds(scrollable),
            xPos = e.getDocumentLeft(),
            yPos = e.getDocumentTop(),
            diff = {
              "left": bounds.left - xPos,
              "right": bounds.right - xPos,
              "top": bounds.top - yPos,
              "bottom": bounds.bottom - yPos
            },
            edgeType = null,
            axis = "",
            exceedanceAmount = 0;

        edgeType = this._getEdgeType(diff, this.getDragScrollThresholdX(), this.getDragScrollThresholdY());
        if (!edgeType) {
          // return if not within edge threshold
          return;
        }
        axis = this._getAxis(edgeType);

        if (this._isScrollbarVisible(scrollable, axis)) {
          exceedanceAmount = this._calculateThresholdExceedance(diff[edgeType], this._getThresholdByEdgeType(edgeType));

          if (this.__dragScrollTimer) {
            this.__dragScrollTimer.dispose();
          }

          this.__dragScrollTimer = new qx.event.Timer(50);
          this.__dragScrollTimer.addListener("interval",
            function(scrollable, axis, amount) {
              this._scrollBy(scrollable, axis, amount);
            }.bind(this, scrollable, axis, exceedanceAmount));
          this.__dragScrollTimer.start();
        }
      }
    },

    /**
     * Event handler for the dragend event.
     *
     * @param e {qx.event.type.Drag} The drag event instance.
     */
    __onDragend : function(e)
    {
      if (this.__dragScrollTimer) {
        this.__dragScrollTimer.stop();
      }
    }
  },


  destruct : function() {
    if (this.__dragScrollTimer) {
      this.__dragScrollTimer.dispose();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The ScrollArea provides a container widget with on demand scroll bars
 * if the content size exceeds the size of the container.
 *
 * @childControl pane {qx.ui.core.scroll.ScrollPane} pane which holds the content to scroll
 * @childControl scrollbar-x {qx.ui.core.scroll.ScrollBar?qx.ui.core.scroll.NativeScrollBar} horizontal scrollbar
 * @childControl scrollbar-y {qx.ui.core.scroll.ScrollBar?qx.ui.core.scroll.NativeScrollBar} vertical scrollbar
 * @childControl corner {qx.ui.core.Widget} corner where no scrollbar is shown
 */
qx.Class.define("qx.ui.core.scroll.AbstractScrollArea",
{
  extend : qx.ui.core.Widget,
  include : [
    qx.ui.core.scroll.MScrollBarFactory,
    qx.ui.core.scroll.MRoll,
    qx.ui.core.MDragDropScrolling
  ],
  type : "abstract",


  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * The default width which is used for the width of the scroll bar if
     * overlaid.
     */
    DEFAULT_SCROLLBAR_WIDTH : 14
  },



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    if (qx.core.Environment.get("os.scrollBarOverlayed")) {
      // use a plain canvas to overlay the scroll bars
      this._setLayout(new qx.ui.layout.Canvas());
    } else {
      // Create 'fixed' grid layout
      var grid = new qx.ui.layout.Grid();
      grid.setColumnFlex(0, 1);
      grid.setRowFlex(0, 1);
      this._setLayout(grid);
    }

    // Roll listener for scrolling
    this._addRollHandling();
  },


  events : {
    /** Fired as soon as the scroll animation in X direction ends. */
    scrollAnimationXEnd: 'qx.event.type.Event',

    /** Fired as soon as the scroll animation in X direction ends. */
    scrollAnimationYEnd: 'qx.event.type.Event'
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "scrollarea"
    },


    // overridden
    width :
    {
      refine : true,
      init : 100
    },


    // overridden
    height :
    {
      refine : true,
      init : 200
    },


    /**
     * The policy, when the horizontal scrollbar should be shown.
     * <ul>
     *   <li><b>auto</b>: Show scrollbar on demand</li>
     *   <li><b>on</b>: Always show the scrollbar</li>
     *   <li><b>off</b>: Never show the scrollbar</li>
     * </ul>
     */
    scrollbarX :
    {
      check : ["auto", "on", "off"],
      init : "auto",
      themeable : true,
      apply : "_computeScrollbars"
    },


    /**
     * The policy, when the horizontal scrollbar should be shown.
     * <ul>
     *   <li><b>auto</b>: Show scrollbar on demand</li>
     *   <li><b>on</b>: Always show the scrollbar</li>
     *   <li><b>off</b>: Never show the scrollbar</li>
     * </ul>
     */
    scrollbarY :
    {
      check : ["auto", "on", "off"],
      init : "auto",
      themeable : true,
      apply : "_computeScrollbars"
    },


    /**
     * Group property, to set the overflow of both scroll bars.
     */
    scrollbar : {
      group : [ "scrollbarX", "scrollbarY" ]
    }
  },






  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      CHILD CONTROL SUPPORT
    ---------------------------------------------------------------------------
    */

    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "pane":
          control = new qx.ui.core.scroll.ScrollPane();

          control.addListener("update", this._computeScrollbars, this);
          control.addListener("scrollX", this._onScrollPaneX, this);
          control.addListener("scrollY", this._onScrollPaneY, this);

          if (qx.core.Environment.get("os.scrollBarOverlayed")) {
            this._add(control, {edge: 0});
          } else {
            this._add(control, {row: 0, column: 0});
          }
          break;


        case "scrollbar-x":
          control = this._createScrollBar("horizontal");
          control.setMinWidth(0);

          control.exclude();
          control.addListener("scroll", this._onScrollBarX, this);
          control.addListener("changeVisibility", this._onChangeScrollbarXVisibility, this);
          control.addListener("scrollAnimationEnd", this._onScrollAnimationEnd.bind(this, "X"));

          if (qx.core.Environment.get("os.scrollBarOverlayed")) {
            control.setMinHeight(qx.ui.core.scroll.AbstractScrollArea.DEFAULT_SCROLLBAR_WIDTH);
            this._add(control, {bottom: 0, right: 0, left: 0});
          } else {
            this._add(control, {row: 1, column: 0});
          }
          break;


        case "scrollbar-y":
          control = this._createScrollBar("vertical");
          control.setMinHeight(0);

          control.exclude();
          control.addListener("scroll", this._onScrollBarY, this);
          control.addListener("changeVisibility", this._onChangeScrollbarYVisibility, this);
          control.addListener("scrollAnimationEnd", this._onScrollAnimationEnd.bind(this, "Y"));

          if (qx.core.Environment.get("os.scrollBarOverlayed")) {
            control.setMinWidth(qx.ui.core.scroll.AbstractScrollArea.DEFAULT_SCROLLBAR_WIDTH);
            this._add(control, {right: 0, bottom: 0, top: 0});
          } else {
            this._add(control, {row: 0, column: 1});
          }
          break;


        case "corner":
          control = new qx.ui.core.Widget();
          control.setWidth(0);
          control.setHeight(0);
          control.exclude();

          if (!qx.core.Environment.get("os.scrollBarOverlayed")) {
            // only add for non overlayed scroll bars
            this._add(control, {row: 1, column: 1});
          }
          break;
      }

      return control || this.base(arguments, id);
    },




    /*
    ---------------------------------------------------------------------------
      PANE SIZE
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the boundaries of the pane.
     *
     * @return {Map} The pane boundaries.
     */
    getPaneSize : function() {
      return this.getChildControl("pane").getInnerSize();
    },






    /*
    ---------------------------------------------------------------------------
      ITEM LOCATION SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the top offset of the given item in relation to the
     * inner height of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemTop : function(item) {
      return this.getChildControl("pane").getItemTop(item);
    },


    /**
     * Returns the top offset of the end of the given item in relation to the
     * inner height of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemBottom : function(item) {
      return this.getChildControl("pane").getItemBottom(item);
    },


    /**
     * Returns the left offset of the given item in relation to the
     * inner width of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemLeft : function(item) {
      return this.getChildControl("pane").getItemLeft(item);
    },


    /**
     * Returns the left offset of the end of the given item in relation to the
     * inner width of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Right offset
     */
    getItemRight : function(item) {
      return this.getChildControl("pane").getItemRight(item);
    },





    /*
    ---------------------------------------------------------------------------
      SCROLL SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Scrolls the element's content to the given left coordinate
     *
     * @param value {Integer} The vertical position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollToX : function(value, duration) {
      // First flush queue before scroll
      qx.ui.core.queue.Manager.flush();

      this.getChildControl("scrollbar-x").scrollTo(value, duration);
    },


    /**
     * Scrolls the element's content by the given left offset
     *
     * @param value {Integer} The vertical position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollByX : function(value, duration) {
      // First flush queue before scroll
      qx.ui.core.queue.Manager.flush();

      this.getChildControl("scrollbar-x").scrollBy(value, duration);
    },


    /**
     * Returns the scroll left position of the content
     *
     * @return {Integer} Horizontal scroll position
     */
    getScrollX : function()
    {
      var scrollbar = this.getChildControl("scrollbar-x", true);
      return scrollbar ? scrollbar.getPosition() : 0;
    },


    /**
     * Scrolls the element's content to the given top coordinate
     *
     * @param value {Integer} The horizontal position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollToY : function(value, duration) {
      // First flush queue before scroll
      qx.ui.core.queue.Manager.flush();

      this.getChildControl("scrollbar-y").scrollTo(value, duration);
    },


    /**
     * Scrolls the element's content by the given top offset
     *
     * @param value {Integer} The horizontal position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollByY : function(value, duration) {
      // First flush queue before scroll
      qx.ui.core.queue.Manager.flush();

      this.getChildControl("scrollbar-y").scrollBy(value, duration);
    },


    /**
     * Returns the scroll top position of the content
     *
     * @return {Integer} Vertical scroll position
     */
    getScrollY : function()
    {
      var scrollbar = this.getChildControl("scrollbar-y", true);
      return scrollbar ? scrollbar.getPosition() : 0;
    },


    /**
     * In case a scroll animation is currently running in X direction,
     * it will be stopped. If not, the method does nothing.
     */
    stopScrollAnimationX : function() {
      var scrollbar = this.getChildControl("scrollbar-x", true);
      if (scrollbar) {
        scrollbar.stopScrollAnimation();
      }
    },


    /**
     * In case a scroll animation is currently running in X direction,
     * it will be stopped. If not, the method does nothing.
     */
    stopScrollAnimationY : function() {
      var scrollbar = this.getChildControl("scrollbar-y", true);
      if (scrollbar) {
        scrollbar.stopScrollAnimation();
      }
    },



    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */
    /**
     * Event handler for the scroll animation end event for both scroll bars.
     *
     * @param direction {String} Either "X" or "Y".
     */
    _onScrollAnimationEnd : function(direction) {
      this.fireEvent("scrollAnimation" + direction + "End");
    },

    /**
     * Event handler for the scroll event of the horizontal scrollbar
     *
     * @param e {qx.event.type.Data} The scroll event object
     */
    _onScrollBarX : function(e) {
      this.getChildControl("pane").scrollToX(e.getData());
    },


    /**
     * Event handler for the scroll event of the vertical scrollbar
     *
     * @param e {qx.event.type.Data} The scroll event object
     */
    _onScrollBarY : function(e) {
      this.getChildControl("pane").scrollToY(e.getData());
    },


    /**
     * Event handler for the horizontal scroll event of the pane
     *
     * @param e {qx.event.type.Data} The scroll event object
     */
    _onScrollPaneX : function(e) {
      var scrollbar = this.getChildControl("scrollbar-x");
      if (scrollbar) {
        scrollbar.updatePosition(e.getData());
      }
    },


    /**
     * Event handler for the vertical scroll event of the pane
     *
     * @param e {qx.event.type.Data} The scroll event object
     */
    _onScrollPaneY : function(e) {
      var scrollbar = this.getChildControl("scrollbar-y");
      if (scrollbar) {
        scrollbar.updatePosition(e.getData());
      }
    },


    /**
     * Event handler for visibility changes of horizontal scrollbar.
     *
     * @param e {qx.event.type.Event} Property change event
     */
    _onChangeScrollbarXVisibility : function(e)
    {
      var showX = this._isChildControlVisible("scrollbar-x");
      var showY = this._isChildControlVisible("scrollbar-y");

      if (!showX) {
        this.scrollToX(0);
      }

      showX && showY ? this._showChildControl("corner") : this._excludeChildControl("corner");
    },


    /**
     * Event handler for visibility changes of horizontal scrollbar.
     *
     * @param e {qx.event.type.Event} Property change event
     */
    _onChangeScrollbarYVisibility : function(e)
    {
      var showX = this._isChildControlVisible("scrollbar-x");
      var showY = this._isChildControlVisible("scrollbar-y");

      if (!showY) {
        this.scrollToY(0);
      }

      showX && showY ? this._showChildControl("corner") : this._excludeChildControl("corner");
    },




    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Computes the visibility state for scrollbars.
     *
     */
    _computeScrollbars : function()
    {
      var pane = this.getChildControl("pane");
      var content = pane.getChildren()[0];
      if (!content)
      {
        this._excludeChildControl("scrollbar-x");
        this._excludeChildControl("scrollbar-y");
        return;
      }

      var innerSize = this.getInnerSize();
      var paneSize = pane.getInnerSize();
      var scrollSize = pane.getScrollSize();

      // if the widget has not yet been rendered, return and try again in the
      // resize event
      if (!paneSize || !scrollSize) {
        return;
      }

      var scrollbarX = this.getScrollbarX();
      var scrollbarY = this.getScrollbarY();

      if (scrollbarX === "auto" && scrollbarY === "auto")
      {
        // Check if the container is big enough to show
        // the full content.
        var showX = scrollSize.width > innerSize.width;
        var showY = scrollSize.height > innerSize.height;

        // Dependency check
        // We need a special intelligence here when only one
        // of the autosized axis requires a scrollbar
        // This scrollbar may then influence the need
        // for the other one as well.
        if ((showX || showY) && !(showX && showY))
        {
          if (showX) {
            showY = scrollSize.height > paneSize.height;
          } else if (showY) {
            showX = scrollSize.width > paneSize.width;
          }
        }
      }
      else
      {
        var showX = scrollbarX === "on";
        var showY = scrollbarY === "on";

        // Check auto values afterwards with already
        // corrected client dimensions
        if (scrollSize.width > (showX ? paneSize.width : innerSize.width) && scrollbarX === "auto") {
          showX = true;
        }

        if (scrollSize.height > (showX ? paneSize.height : innerSize.height) && scrollbarY === "auto") {
          showY = true;
        }
      }

      // Update scrollbars
      if (showX)
      {
        var barX = this.getChildControl("scrollbar-x");

        barX.show();
        barX.setMaximum(Math.max(0, scrollSize.width - paneSize.width));
        barX.setKnobFactor((scrollSize.width === 0) ? 0 : paneSize.width / scrollSize.width);
      }
      else
      {
        this._excludeChildControl("scrollbar-x");
      }

      if (showY)
      {
        var barY = this.getChildControl("scrollbar-y");

        barY.show();
        barY.setMaximum(Math.max(0, scrollSize.height - paneSize.height));
        barY.setKnobFactor((scrollSize.height === 0) ? 0 : paneSize.height / scrollSize.height);
      }
      else
      {
        this._excludeChildControl("scrollbar-y");
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The grid layout manager arranges the items in a two dimensional
 * grid. Widgets can be placed into the grid's cells and may span multiple rows
 * and columns.
 *
 * *Features*
 *
 * * Flex values for rows and columns
 * * Minimal and maximal column and row sizes
 * * Manually setting of column and row sizes
 * * Horizontal and vertical alignment
 * * Horizontal and vertical spacing
 * * Column and row spans
 * * Auto-sizing
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>row</strong> <em>(Integer)</em>: The row of the cell the
 *   widget should occupy. Each cell can only contain one widget. This layout
 *   property is mandatory.
 * </li>
 * <li><strong>column</strong> <em>(Integer)</em>: The column of the cell the
 *   widget should occupy. Each cell can only contain one widget. This layout
 *   property is mandatory.
 * </li>
 * <li><strong>rowSpan</strong> <em>(Integer)</em>: The number of rows, the
 *   widget should span, starting from the row specified in the <code>row</code>
 *   property. The cells in the spanned rows must be empty as well.
 * </li>
 * <li><strong>colSpan</strong> <em>(Integer)</em>: The number of columns, the
 *   widget should span, starting from the column specified in the <code>column</code>
 *   property. The cells in the spanned columns must be empty as well.
 * </li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the grid layout.
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.Grid();
 * layout.setRowFlex(0, 1); // make row 0 flexible
 * layout.setColumnWidth(1, 200); // set with of column 1 to 200 pixel
 *
 * var container = new qx.ui.container.Composite(layout);
 * container.add(new qx.ui.core.Widget(), {row: 0, column: 0});
 * container.add(new qx.ui.core.Widget(), {row: 0, column: 1});
 * container.add(new qx.ui.core.Widget(), {row: 1, column: 0, rowSpan: 2});
 * </pre>
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/grid.html'>
 * Extended documentation</a> and links to demos of this layout in the qooxdoo manual.
 */
qx.Class.define("qx.ui.layout.Grid",
{
  extend : qx.ui.layout.Abstract,






  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param spacingX {Integer?0} The horizontal spacing between grid cells.
   *     Sets {@link #spacingX}.
   * @param spacingY {Integer?0} The vertical spacing between grid cells.
   *     Sets {@link #spacingY}.
   */
  construct : function(spacingX, spacingY)
  {
    this.base(arguments);

    this.__rowData = [];
    this.__colData = [];

    if (spacingX) {
      this.setSpacingX(spacingX);
    }

    if (spacingY) {
      this.setSpacingY(spacingY);
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * The horizontal spacing between grid cells.
     */
    spacingX :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    },


    /**
     * The vertical spacing between grid cells.
     */
    spacingY :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** @type {Array} 2D array of grid cell data */
    __grid : null,
    __rowData : null,
    __colData : null,

    __colSpans : null,
    __rowSpans : null,
    __maxRowIndex : null,
    __maxColIndex : null,

    /** @type {Array} cached row heights */
    __rowHeights : null,

    /** @type {Array} cached column widths */
    __colWidths : null,



    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        var layoutProperties = {
          "row" : 1,
          "column" : 1,
          "rowSpan" : 1,
          "colSpan" : 1
        }
        this.assert(layoutProperties[name] == 1, "The property '"+name+"' is not supported by the Grid layout!");
        this.assertInteger(value);
        this.assert(value >= 0, "Value must be positive");
      },

      "false" : null
    }),


    /**
     * Rebuild the internal representation of the grid
     */
    __buildGrid : function()
    {
      var grid = [];
      var colSpans = [];
      var rowSpans = [];

      var maxRowIndex = -1;
      var maxColIndex = -1;

      var children = this._getLayoutChildren();

      for (var i=0,l=children.length; i<l; i++)
      {
        var child = children[i];
        var props = child.getLayoutProperties();

        var row = props.row;
        var column = props.column;

        props.colSpan = props.colSpan || 1;
        props.rowSpan = props.rowSpan || 1;

        // validate arguments
        if (row == null || column == null) {
          throw new Error(
            "The layout properties 'row' and 'column' of the child widget '" +
            child + "' must be defined!"
          );
        }

        if (grid[row] && grid[row][column]) {
          throw new Error(
            "Cannot add widget '" + child + "'!. " +
            "There is already a widget '" + grid[row][column] +
            "' in this cell (" + row + ", " + column + ") for '" + this + "'"
          );
        }

        for (var x=column; x<column+props.colSpan; x++)
        {
          for (var y=row; y<row+props.rowSpan; y++)
          {
            if (grid[y] == undefined) {
               grid[y] = [];
            }

            grid[y][x] = child;

            maxColIndex = Math.max(maxColIndex, x);
            maxRowIndex = Math.max(maxRowIndex, y);
          }
        }

        if (props.rowSpan > 1) {
          rowSpans.push(child);
        }

        if (props.colSpan > 1) {
          colSpans.push(child);
        }
      }

      // make sure all columns are defined so that accessing the grid using
      // this.__grid[column][row] will never raise an exception
      for (var y=0; y<=maxRowIndex; y++) {
        if (grid[y] == undefined) {
           grid[y] = [];
        }
      }

      this.__grid = grid;

      this.__colSpans = colSpans;
      this.__rowSpans = rowSpans;

      this.__maxRowIndex = maxRowIndex;
      this.__maxColIndex = maxColIndex;

      this.__rowHeights = null;
      this.__colWidths = null;

      // Clear invalidation marker
      delete this._invalidChildrenCache;
    },


    /**
     * Stores data for a grid row
     *
     * @param row {Integer} The row index
     * @param key {String} The key under which the data should be stored
     * @param value {var} data to store
     */
    _setRowData : function(row, key, value)
    {
      var rowData = this.__rowData[row];

      if (!rowData)
      {
        this.__rowData[row] = {};
        this.__rowData[row][key] = value;
      }
      else
      {
        rowData[key] = value;
      }
    },


    /**
     * Stores data for a grid column
     *
     * @param column {Integer} The column index
     * @param key {String} The key under which the data should be stored
     * @param value {var} data to store
     */
    _setColumnData : function(column, key, value)
    {
      var colData = this.__colData[column];

      if (!colData)
      {
        this.__colData[column] = {};
        this.__colData[column][key] = value;
      }
      else
      {
        colData[key] = value;
      }
    },


    /**
     * Shortcut to set both horizontal and vertical spacing between grid cells
     * to the same value.
     *
     * @param spacing {Integer} new horizontal and vertical spacing
     * @return {qx.ui.layout.Grid} This object (for chaining support).
     */
    setSpacing : function(spacing)
    {
      this.setSpacingY(spacing);
      this.setSpacingX(spacing);
      return this;
    },


    /**
     * Set the default cell alignment for a column. This alignment can be
     * overridden on a per cell basis by setting the cell's content widget's
     * <code>alignX</code> and <code>alignY</code> properties.
     *
     * If on a grid cell both row and a column alignment is set, the horizontal
     * alignment is taken from the column and the vertical alignment is taken
     * from the row.
     *
     * @param column {Integer} Column index
     * @param hAlign {String} The horizontal alignment. Valid values are
     *    "left", "center" and "right".
     * @param vAlign {String} The vertical alignment. Valid values are
     *    "top", "middle", "bottom"
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnAlign : function(column, hAlign, vAlign)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertInteger(column, "Invalid parameter 'column'");
        this.assertInArray(hAlign, ["left", "center", "right"]);
        this.assertInArray(vAlign, ["top", "middle", "bottom"]);
      }

      this._setColumnData(column, "hAlign", hAlign);
      this._setColumnData(column, "vAlign", vAlign);

      this._applyLayoutChange();

      return this;
    },


    /**
     * Get a map of the column's alignment.
     *
     * @param column {Integer} The column index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal column alignment.
     */
    getColumnAlign : function(column)
    {
      var colData = this.__colData[column] || {};

      return {
        vAlign : colData.vAlign || "top",
        hAlign : colData.hAlign || "left"
      };
    },


    /**
     * Set the default cell alignment for a row. This alignment can be
     * overridden on a per cell basis by setting the cell's content widget's
     * <code>alignX</code> and <code>alignY</code> properties.
     *
     * If on a grid cell both row and a column alignment is set, the horizontal
     * alignment is taken from the column and the vertical alignment is taken
     * from the row.
     *
     * @param row {Integer} Row index
     * @param hAlign {String} The horizontal alignment. Valid values are
     *    "left", "center" and "right".
     * @param vAlign {String} The vertical alignment. Valid values are
     *    "top", "middle", "bottom"
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowAlign : function(row, hAlign, vAlign)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertInteger(row, "Invalid parameter 'row'");
        this.assertInArray(hAlign, ["left", "center", "right"]);
        this.assertInArray(vAlign, ["top", "middle", "bottom"]);
      }

      this._setRowData(row, "hAlign", hAlign);
      this._setRowData(row, "vAlign", vAlign);

      this._applyLayoutChange();

      return this;
    },


    /**
     * Get a map of the row's alignment.
     *
     * @param row {Integer} The Row index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal row alignment.
     */
    getRowAlign : function(row)
    {
      var rowData = this.__rowData[row] || {};

      return {
        vAlign : rowData.vAlign || "top",
        hAlign : rowData.hAlign || "left"
      };
    },


    /**
     * Get the widget located in the cell. If a the cell is empty or the widget
     * has a {@link qx.ui.core.Widget#visibility} value of <code>exclude</code>,
     * <code>null</code> is returned.
     *
     * @param row {Integer} The cell's row index
     * @param column {Integer} The cell's column index
     * @return {qx.ui.core.Widget|null}The cell's widget. The value may be null.
     */
    getCellWidget : function(row, column)
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      var row = this.__grid[row] || {};
      return row[column] ||  null;
    },


    /**
     * Get the number of rows in the grid layout.
     *
     * @return {Integer} The number of rows in the layout
     */
    getRowCount : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      return this.__maxRowIndex + 1;
    },


    /**
     * Get the number of columns in the grid layout.
     *
     * @return {Integer} The number of columns in the layout
     */
    getColumnCount : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      return this.__maxColIndex + 1;
    },


    /**
     * Get a map of the cell's alignment. For vertical alignment the row alignment
     * takes precedence over the column alignment. For horizontal alignment it is
     * the over way round. If an alignment is set on the cell widget using
     * {@link qx.ui.core.LayoutItem#setLayoutProperties}, this alignment takes
     * always precedence over row or column alignment.
     *
     * @param row {Integer} The cell's row index
     * @param column {Integer} The cell's column index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal cell alignment.
     */
    getCellAlign : function(row, column)
    {
      var vAlign = "top";
      var hAlign = "left";

      var rowData = this.__rowData[row];
      var colData = this.__colData[column];

      var widget = this.__grid[row][column];
      if (widget)
      {
        var widgetProps = {
          vAlign : widget.getAlignY(),
          hAlign : widget.getAlignX()
        }
      }
      else
      {
        widgetProps = {};
      }

      // compute vAlign
      // precedence : widget -> row -> column
      if (widgetProps.vAlign) {
        vAlign = widgetProps.vAlign;
      } else if (rowData && rowData.vAlign) {
        vAlign = rowData.vAlign;
      } else if (colData && colData.vAlign) {
        vAlign = colData.vAlign;
      }

      // compute hAlign
      // precedence : widget -> column -> row
      if (widgetProps.hAlign) {
        hAlign = widgetProps.hAlign;
      } else if (colData && colData.hAlign) {
        hAlign = colData.hAlign;
      } else if (rowData && rowData.hAlign) {
        hAlign = rowData.hAlign;
      }

      return {
        vAlign : vAlign,
        hAlign : hAlign
      }
    },


    /**
     * Set the flex value for a grid column.
     * By default the column flex value is <code>0</code>.
     *
     * @param column {Integer} The column index
     * @param flex {Integer} The column's flex value
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnFlex : function(column, flex)
    {
      this._setColumnData(column, "flex", flex);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the flex value of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's flex value
     */
    getColumnFlex : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.flex !== undefined ? colData.flex : 0;
    },


    /**
     * Set the flex value for a grid row.
     * By default the row flex value is <code>0</code>.
     *
     * @param row {Integer} The row index
     * @param flex {Integer} The row's flex value
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowFlex : function(row, flex)
    {
      this._setRowData(row, "flex", flex);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the flex value of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's flex value
     */
    getRowFlex : function(row)
    {
      var rowData = this.__rowData[row] || {};
      var rowFlex = rowData.flex !== undefined ? rowData.flex : 0
      return rowFlex;
    },


    /**
     * Set the maximum width of a grid column.
     * The default value is <code>Infinity</code>.
     *
     * @param column {Integer} The column index
     * @param maxWidth {Integer} The column's maximum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnMaxWidth : function(column, maxWidth)
    {
      this._setColumnData(column, "maxWidth", maxWidth);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the maximum width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's maximum width
     */
    getColumnMaxWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.maxWidth !== undefined ? colData.maxWidth : Infinity;
    },


    /**
     * Set the preferred width of a grid column.
     * The default value is <code>Infinity</code>.
     *
     * @param column {Integer} The column index
     * @param width {Integer} The column's width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnWidth : function(column, width)
    {
      this._setColumnData(column, "width", width);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the preferred width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's width
     */
    getColumnWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.width !== undefined ? colData.width : null;
    },


    /**
     * Set the minimum width of a grid column.
     * The default value is <code>0</code>.
     *
     * @param column {Integer} The column index
     * @param minWidth {Integer} The column's minimum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnMinWidth : function(column, minWidth)
    {
      this._setColumnData(column, "minWidth", minWidth);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the minimum width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's minimum width
     */
    getColumnMinWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.minWidth || 0;
    },


    /**
     * Set the maximum height of a grid row.
     * The default value is <code>Infinity</code>.
     *
     * @param row {Integer} The row index
     * @param maxHeight {Integer} The row's maximum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowMaxHeight : function(row, maxHeight)
    {
      this._setRowData(row, "maxHeight", maxHeight);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the maximum height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's maximum width
     */
    getRowMaxHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.maxHeight || Infinity;
    },


    /**
     * Set the preferred height of a grid row.
     * The default value is <code>Infinity</code>.
     *
     * @param row {Integer} The row index
     * @param height {Integer} The row's width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowHeight : function(row, height)
    {
      this._setRowData(row, "height", height);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the preferred height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's width
     */
    getRowHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.height !== undefined ? rowData.height : null;
    },


    /**
     * Set the minimum height of a grid row.
     * The default value is <code>0</code>.
     *
     * @param row {Integer} The row index
     * @param minHeight {Integer} The row's minimum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowMinHeight : function(row, minHeight)
    {
      this._setRowData(row, "minHeight", minHeight);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the minimum height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's minimum width
     */
    getRowMinHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.minHeight || 0;
    },


    /**
     * Computes the widget's size hint including the widget's margins
     *
     * @param widget {qx.ui.core.LayoutItem} The widget to get the size for
     * @return {Map} a size hint map
     */
    __getOuterSize : function(widget)
    {
      var hint = widget.getSizeHint();
      var hMargins = widget.getMarginLeft() + widget.getMarginRight();
      var vMargins = widget.getMarginTop() + widget.getMarginBottom();

      var outerSize = {
        height: hint.height + vMargins,
        width: hint.width + hMargins,
        minHeight: hint.minHeight + vMargins,
        minWidth: hint.minWidth + hMargins,
        maxHeight: hint.maxHeight + vMargins,
        maxWidth: hint.maxWidth + hMargins
      }

      return outerSize;
    },


    /**
     * Check whether all row spans fit with their preferred height into the
     * preferred row heights. If there is not enough space, the preferred
     * row sizes are increased. The distribution respects the flex and max
     * values of the rows.
     *
     *  The same is true for the min sizes.
     *
     *  The height array is modified in place.
     *
     * @param rowHeights {Map[]} The current row height array as computed by
     *     {@link #_getRowHeights}.
     */
    _fixHeightsRowSpan : function(rowHeights)
    {
      var vSpacing = this.getSpacingY();

      for (var i=0, l=this.__rowSpans.length; i<l; i++)
      {
        var widget = this.__rowSpans[i];

        var hint = this.__getOuterSize(widget);

        var widgetProps = widget.getLayoutProperties();
        var widgetRow = widgetProps.row;

        var prefSpanHeight = vSpacing * (widgetProps.rowSpan - 1);
        var minSpanHeight = prefSpanHeight;

        var rowFlexes = {};

        for (var j=0; j<widgetProps.rowSpan; j++)
        {
          var row = widgetProps.row+j;
          var rowHeight = rowHeights[row];
          var rowFlex = this.getRowFlex(row);

          if (rowFlex > 0)
          {
            // compute flex array for the preferred height
            rowFlexes[row] =
            {
              min : rowHeight.minHeight,
              value : rowHeight.height,
              max : rowHeight.maxHeight,
              flex: rowFlex
            };
          }

          prefSpanHeight += rowHeight.height;
          minSpanHeight += rowHeight.minHeight;
        }

        // If there is not enough space for the preferred size
        // increment the preferred row sizes.
        if (prefSpanHeight < hint.height)
        {
          if (!qx.lang.Object.isEmpty(rowFlexes)) {
            var rowIncrements = qx.ui.layout.Util.computeFlexOffsets(
              rowFlexes, hint.height, prefSpanHeight
            );

            for (var k=0; k<widgetProps.rowSpan; k++)
            {
              var offset = rowIncrements[widgetRow+k] ? rowIncrements[widgetRow+k].offset : 0;
              rowHeights[widgetRow+k].height += offset;
            }
          // row is too small and we have no flex value set
          } else {
            var totalSpacing = vSpacing * (widgetProps.rowSpan - 1);
            var availableHeight = hint.height - totalSpacing;

            // get the row height which every child would need to share the
            // available hight equally
            var avgRowHeight =
              Math.floor(availableHeight / widgetProps.rowSpan);

            // get the hight already used and the number of children which do
            // not have at least that avg row height
            var usedHeight = 0;
            var rowsNeedAddition = 0;
            for (var k = 0; k < widgetProps.rowSpan; k++) {
              var currentHeight = rowHeights[widgetRow + k].height;
              usedHeight += currentHeight;
              if (currentHeight < avgRowHeight) {
                rowsNeedAddition++;
              }
            }

            // the difference of available and used needs to be shared among
            // those not having the min size
            var additionalRowHeight =
              Math.floor((availableHeight - usedHeight) / rowsNeedAddition);

            // add the extra height to the too small children
            for (var k = 0; k < widgetProps.rowSpan; k++) {
              if (rowHeights[widgetRow + k].height < avgRowHeight) {
                rowHeights[widgetRow + k].height += additionalRowHeight;
              }
            }
          }
        }

        // If there is not enough space for the min size
        // increment the min row sizes.
        if (minSpanHeight < hint.minHeight)
        {
          var rowIncrements = qx.ui.layout.Util.computeFlexOffsets(
            rowFlexes, hint.minHeight, minSpanHeight
          );

          for (var j=0; j<widgetProps.rowSpan; j++)
          {
            var offset = rowIncrements[widgetRow+j] ? rowIncrements[widgetRow+j].offset : 0;
            rowHeights[widgetRow+j].minHeight += offset;
          }
        }
      }
    },


    /**
     * Check whether all col spans fit with their preferred width into the
     * preferred column widths. If there is not enough space the preferred
     * column sizes are increased. The distribution respects the flex and max
     * values of the columns.
     *
     *  The same is true for the min sizes.
     *
     *  The width array is modified in place.
     *
     * @param colWidths {Map[]} The current column width array as computed by
     *     {@link #_getColWidths}.
     */
    _fixWidthsColSpan : function(colWidths)
    {
      var hSpacing = this.getSpacingX();

      for (var i=0, l=this.__colSpans.length; i<l; i++)
      {
        var widget = this.__colSpans[i];

        var hint = this.__getOuterSize(widget);

        var widgetProps = widget.getLayoutProperties();
        var widgetColumn = widgetProps.column;

        var prefSpanWidth = hSpacing * (widgetProps.colSpan - 1);
        var minSpanWidth = prefSpanWidth;

        var colFlexes = {};

        var offset;

        for (var j=0; j<widgetProps.colSpan; j++)
        {
          var col = widgetProps.column+j;
          var colWidth = colWidths[col];
          var colFlex = this.getColumnFlex(col);

          // compute flex array for the preferred width
          if (colFlex > 0)
          {
            colFlexes[col] =
            {
              min : colWidth.minWidth,
              value : colWidth.width,
              max : colWidth.maxWidth,
              flex: colFlex
            };
          }

          prefSpanWidth += colWidth.width;
          minSpanWidth += colWidth.minWidth;
        }

        // If there is not enought space for the preferred size
        // increment the preferred column sizes.
        if (prefSpanWidth < hint.width)
        {
          var colIncrements = qx.ui.layout.Util.computeFlexOffsets(
            colFlexes, hint.width, prefSpanWidth
          );

          for (var j=0; j<widgetProps.colSpan; j++)
          {
            offset = colIncrements[widgetColumn+j] ? colIncrements[widgetColumn+j].offset : 0;
            colWidths[widgetColumn+j].width += offset;
          }
        }

        // If there is not enought space for the min size
        // increment the min column sizes.
        if (minSpanWidth < hint.minWidth)
        {
          var colIncrements = qx.ui.layout.Util.computeFlexOffsets(
            colFlexes, hint.minWidth, minSpanWidth
          );

          for (var j=0; j<widgetProps.colSpan; j++)
          {
            offset = colIncrements[widgetColumn+j] ? colIncrements[widgetColumn+j].offset : 0;
            colWidths[widgetColumn+j].minWidth += offset;
          }
        }
      }
    },


    /**
     * Compute the min/pref/max row heights.
     *
     * @return {Map[]} An array containg height information for each row. The
     *     entries have the keys <code>minHeight</code>, <code>maxHeight</code> and
     *     <code>height</code>.
     */
    _getRowHeights : function()
    {
      if (this.__rowHeights != null) {
        return this.__rowHeights;
      }

      var rowHeights = [];

      var maxRowIndex = this.__maxRowIndex;
      var maxColIndex = this.__maxColIndex;

      for (var row=0; row<=maxRowIndex; row++)
      {
        var minHeight = 0;
        var height = 0;
        var maxHeight = 0;

        for (var col=0; col<=maxColIndex; col++)
        {
          var widget = this.__grid[row][col];
          if (!widget) {
            continue;
          }

          // ignore rows with row spans at this place
          // these rows will be taken into account later
          var widgetRowSpan = widget.getLayoutProperties().rowSpan || 0;
          if (widgetRowSpan > 1) {
            continue;
          }

          var cellSize = this.__getOuterSize(widget);

          if (this.getRowFlex(row) > 0) {
            minHeight = Math.max(minHeight, cellSize.minHeight);
          } else {
            minHeight = Math.max(minHeight, cellSize.height);
          }

          height = Math.max(height, cellSize.height);
        }

        var minHeight = Math.max(minHeight, this.getRowMinHeight(row));
        var maxHeight = this.getRowMaxHeight(row);

        if (this.getRowHeight(row) !== null) {
          var height = this.getRowHeight(row);
        } else {
          var height = Math.max(minHeight, Math.min(height, maxHeight));
        }

        rowHeights[row] = {
          minHeight : minHeight,
          height : height,
          maxHeight : maxHeight
        };
      }

      if (this.__rowSpans.length > 0) {
        this._fixHeightsRowSpan(rowHeights);
      }

      this.__rowHeights = rowHeights;
      return rowHeights;
    },


    /**
     * Compute the min/pref/max column widths.
     *
     * @return {Map[]} An array containg width information for each column. The
     *     entries have the keys <code>minWidth</code>, <code>maxWidth</code> and
     *     <code>width</code>.
     */
    _getColWidths : function()
    {
      if (this.__colWidths != null) {
        return this.__colWidths;
      }

      var colWidths = [];

      var maxColIndex = this.__maxColIndex;
      var maxRowIndex = this.__maxRowIndex;

      for (var col=0; col<=maxColIndex; col++)
      {
        var width = 0;
        var minWidth = 0;
        var maxWidth = Infinity;

        for (var row=0; row<=maxRowIndex; row++)
        {
          var widget = this.__grid[row][col];
          if (!widget) {
            continue;
          }

          // ignore columns with col spans at this place
          // these columns will be taken into account later
          var widgetColSpan = widget.getLayoutProperties().colSpan || 0;
          if (widgetColSpan > 1) {
            continue;
          }

          var cellSize = this.__getOuterSize(widget);

          if (this.getColumnFlex(col) > 0) {
            minWidth = Math.max(minWidth, cellSize.minWidth);
          } else {
            minWidth = Math.max(minWidth, cellSize.width);
          }

          width = Math.max(width, cellSize.width);
        }

        minWidth = Math.max(minWidth, this.getColumnMinWidth(col));
        maxWidth = this.getColumnMaxWidth(col);

        if (this.getColumnWidth(col) !== null) {
          var width = this.getColumnWidth(col);
        } else {
          var width = Math.max(minWidth, Math.min(width, maxWidth));
        }

        colWidths[col] = {
          minWidth: minWidth,
          width : width,
          maxWidth : maxWidth
        };
      }

      if (this.__colSpans.length > 0) {
        this._fixWidthsColSpan(colWidths);
      }

      this.__colWidths = colWidths;
      return colWidths;
    },


    /**
     * Computes for each column by how many pixels it must grow or shrink, taking
     * the column flex values and min/max widths into account.
     *
     * @param width {Integer} The grid width
     * @return {Integer[]} Sparse array of offsets to add to each column width. If
     *     an array entry is empty nothing should be added to the column.
     */
    _getColumnFlexOffsets : function(width)
    {
      var hint = this.getSizeHint();
      var diff = width - hint.width;

      if (diff == 0) {
        return {};
      }

      // collect all flexible children
      var colWidths = this._getColWidths();
      var flexibles = {};

      for (var i=0, l=colWidths.length; i<l; i++)
      {
        var col = colWidths[i];
        var colFlex = this.getColumnFlex(i);

        if (
          (colFlex <= 0) ||
          (col.width == col.maxWidth && diff > 0) ||
          (col.width == col.minWidth && diff < 0)
        ) {
          continue;
        }

        flexibles[i] ={
          min : col.minWidth,
          value : col.width,
          max : col.maxWidth,
          flex : colFlex
        };
      }

      return qx.ui.layout.Util.computeFlexOffsets(flexibles, width, hint.width);
    },


    /**
     * Computes for each row by how many pixels it must grow or shrink, taking
     * the row flex values and min/max heights into account.
     *
     * @param height {Integer} The grid height
     * @return {Integer[]} Sparse array of offsets to add to each row height. If
     *     an array entry is empty nothing should be added to the row.
     */
    _getRowFlexOffsets : function(height)
    {
      var hint = this.getSizeHint();
      var diff = height - hint.height;

      if (diff == 0) {
        return {};
      }

      // collect all flexible children
      var rowHeights = this._getRowHeights();
      var flexibles = {};

      for (var i=0, l=rowHeights.length; i<l; i++)
      {
        var row = rowHeights[i];
        var rowFlex = this.getRowFlex(i);

        if (
          (rowFlex <= 0) ||
          (row.height == row.maxHeight && diff > 0) ||
          (row.height == row.minHeight && diff < 0)
        ) {
          continue;
        }

        flexibles[i] = {
          min : row.minHeight,
          value : row.height,
          max : row.maxHeight,
          flex : rowFlex
        };
      }

      return qx.ui.layout.Util.computeFlexOffsets(flexibles, height, hint.height);
    },


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      var Util = qx.ui.layout.Util;
      var hSpacing = this.getSpacingX();
      var vSpacing = this.getSpacingY();

      // calculate column widths
      var prefWidths = this._getColWidths();
      var colStretchOffsets = this._getColumnFlexOffsets(availWidth);

      var colWidths = [];

      var maxColIndex = this.__maxColIndex;
      var maxRowIndex = this.__maxRowIndex;

      var offset;

      for (var col=0; col<=maxColIndex; col++)
      {
        offset = colStretchOffsets[col] ? colStretchOffsets[col].offset : 0;
        colWidths[col] = prefWidths[col].width + offset;
      }

      // calculate row heights
      var prefHeights = this._getRowHeights();
      var rowStretchOffsets = this._getRowFlexOffsets(availHeight);

      var rowHeights = [];

      for (var row=0; row<=maxRowIndex; row++)
      {
        offset = rowStretchOffsets[row] ? rowStretchOffsets[row].offset : 0;
        rowHeights[row] = prefHeights[row].height + offset;
      }

      // do the layout
      var left = 0;
      for (var col=0; col<=maxColIndex; col++)
      {
        var top = 0;

        for (var row=0; row<=maxRowIndex; row++)
        {
          var widget = this.__grid[row][col];

          // ignore empty cells
          if (!widget)
          {
            top += rowHeights[row] + vSpacing;
            continue;
          }

          var widgetProps = widget.getLayoutProperties();

          // ignore cells, which have cell spanning but are not the origin
          // of the widget
          if(widgetProps.row !== row || widgetProps.column !== col)
          {
            top += rowHeights[row] + vSpacing;
            continue;
          }

          // compute sizes width including cell spanning
          var spanWidth = hSpacing * (widgetProps.colSpan - 1);
          for (var i=0; i<widgetProps.colSpan; i++) {
            spanWidth += colWidths[col+i];
          }

          var spanHeight = vSpacing * (widgetProps.rowSpan - 1);
          for (var i=0; i<widgetProps.rowSpan; i++) {
            spanHeight += rowHeights[row+i];
          }

          var cellHint = widget.getSizeHint();
          var marginTop = widget.getMarginTop();
          var marginLeft = widget.getMarginLeft();
          var marginBottom = widget.getMarginBottom();
          var marginRight = widget.getMarginRight();

          var cellWidth = Math.max(cellHint.minWidth, Math.min(spanWidth-marginLeft-marginRight, cellHint.maxWidth));
          var cellHeight = Math.max(cellHint.minHeight, Math.min(spanHeight-marginTop-marginBottom, cellHint.maxHeight));

          var cellAlign = this.getCellAlign(row, col);
          var cellLeft = left + Util.computeHorizontalAlignOffset(cellAlign.hAlign, cellWidth, spanWidth, marginLeft, marginRight);
          var cellTop = top + Util.computeVerticalAlignOffset(cellAlign.vAlign, cellHeight, spanHeight, marginTop, marginBottom);

          widget.renderLayout(
            cellLeft + padding.left,
            cellTop + padding.top,
            cellWidth,
            cellHeight
          );

          top += rowHeights[row] + vSpacing;
        }

        left += colWidths[col] + hSpacing;
      }
    },


    // overridden
    invalidateLayoutCache : function()
    {
      this.base(arguments);

      this.__colWidths = null;
      this.__rowHeights = null;
    },


    // overridden
    _computeSizeHint : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      // calculate col widths
      var colWidths = this._getColWidths();

      var minWidth=0, width=0;

      for (var i=0, l=colWidths.length; i<l; i++)
      {
        var col = colWidths[i];
        if (this.getColumnFlex(i) > 0) {
          minWidth += col.minWidth;
        } else {
          minWidth += col.width;
        }

        width += col.width;
      }

      // calculate row heights
      var rowHeights = this._getRowHeights();

      var minHeight=0, height=0;
      for (var i=0, l=rowHeights.length; i<l; i++)
      {
        var row = rowHeights[i];

        if (this.getRowFlex(i) > 0) {
          minHeight += row.minHeight;
        } else {
          minHeight += row.height;
        }

        height += row.height;
      }

      var spacingX = this.getSpacingX() * (colWidths.length - 1);
      var spacingY = this.getSpacingY() * (rowHeights.length - 1);

      var hint = {
        minWidth : minWidth + spacingX,
        width : width + spacingX,
        minHeight : minHeight + spacingY,
        height : height + spacingY
      };

      return hint;
    }
  },




  /*
  *****************************************************************************
     DESTRUCT
  *****************************************************************************
  */

  destruct : function()
  {
    this.__grid = this.__rowData = this.__colData = this.__colSpans =
      this.__rowSpans = this.__colWidths = this.__rowHeights = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This class represents a scroll able pane. This means that this widget
 * may contain content which is bigger than the available (inner)
 * dimensions of this widget. The widget also offer methods to control
 * the scrolling position. It can only have exactly one child.
 */
qx.Class.define("qx.ui.core.scroll.ScrollPane",
{
  extend : qx.ui.core.Widget,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this.set({
      minWidth: 0,
      minHeight: 0
    });

    // Automatically configure a "fixed" grow layout.
    this._setLayout(new qx.ui.layout.Grow());

    // Add resize listener to "translate" event
    this.addListener("resize", this._onUpdate);

    var contentEl = this.getContentElement();

    // Synchronizes the DOM scroll position with the properties
    contentEl.addListener("scroll", this._onScroll, this);

    // Fixed some browser quirks e.g. correcting scroll position
    // to the previous value on re-display of a pane
    contentEl.addListener("appear", this._onAppear, this);
  },




  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired on resize of both the container or the content. */
    update : "qx.event.type.Event",

    /** Fired on scroll animation end invoked by 'scroll*' methods. */
    scrollAnimationEnd : "qx.event.type.Event"
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The horizontal scroll position */
    scrollX :
    {
      check : "qx.lang.Type.isNumber(value)&&value>=0&&value<=this.getScrollMaxX()",
      apply : "_applyScrollX",
      event : "scrollX",
      init  : 0
    },

    /** The vertical scroll position */
    scrollY :
    {
      check : "qx.lang.Type.isNumber(value)&&value>=0&&value<=this.getScrollMaxY()",
      apply : "_applyScrollY",
      event : "scrollY",
      init  : 0
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __frame : null,


    /*
    ---------------------------------------------------------------------------
      CONTENT MANAGEMENT
    ---------------------------------------------------------------------------
    */

    /**
     * Configures the content of the scroll pane. Replaces any existing child
     * with the newly given one.
     *
     * @param widget {qx.ui.core.Widget?null} The content widget of the pane
     */
    add : function(widget)
    {
      var old = this._getChildren()[0];
      if (old)
      {
        this._remove(old);
        old.removeListener("resize", this._onUpdate, this);
      }

      if (widget)
      {
        this._add(widget);
        widget.addListener("resize", this._onUpdate, this);
      }
    },


    /**
     * Removes the given widget from the content. The pane is empty
     * afterwards as only one child is supported by the pane.
     *
     * @param widget {qx.ui.core.Widget?null} The content widget of the pane
     */
    remove : function(widget)
    {
      if (widget)
      {
        this._remove(widget);
        widget.removeListener("resize", this._onUpdate, this);
      }
    },


    /**
     * Returns an array containing the current content.
     *
     * @return {Object[]} The content array
     */
    getChildren : function() {
      return this._getChildren();
    },



    /*
    ---------------------------------------------------------------------------
      EVENT LISTENER
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for resize event of content and container
     *
     * @param e {Event} Resize event object
     */
    _onUpdate : function(e) {
      this.fireEvent("update");
    },


    /**
     * Event listener for scroll event of content
     *
     * @param e {qx.event.type.Event} Scroll event object
     */
    _onScroll : function(e)
    {
      var contentEl = this.getContentElement();

      this.setScrollX(contentEl.getScrollX());
      this.setScrollY(contentEl.getScrollY());
    },


    /**
     * Event listener for appear event of content
     *
     * @param e {qx.event.type.Event} Appear event object
     */
    _onAppear : function(e)
    {
      var contentEl = this.getContentElement();

      var internalX = this.getScrollX();
      var domX = contentEl.getScrollX();

      if (internalX != domX) {
        contentEl.scrollToX(internalX);
      }

      var internalY = this.getScrollY();
      var domY = contentEl.getScrollY();

      if (internalY != domY) {
        contentEl.scrollToY(internalY);
      }
    },





    /*
    ---------------------------------------------------------------------------
      ITEM LOCATION SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the top offset of the given item in relation to the
     * inner height of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemTop : function(item)
    {
      var top = 0;

      do
      {
        top += item.getBounds().top;
        item = item.getLayoutParent();
      }
      while (item && item !== this);

      return top;
    },


    /**
     * Returns the top offset of the end of the given item in relation to the
     * inner height of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemBottom : function(item) {
      return this.getItemTop(item) + item.getBounds().height;
    },


    /**
     * Returns the left offset of the given item in relation to the
     * inner width of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Top offset
     */
    getItemLeft : function(item)
    {
      var left = 0;
      var parent;

      do
      {
        left += item.getBounds().left;
        parent = item.getLayoutParent();
        if (parent) {
          left += parent.getInsets().left;
        }
        item = parent;
      }
      while (item && item !== this);

      return left;
    },


    /**
     * Returns the left offset of the end of the given item in relation to the
     * inner width of this widget.
     *
     * @param item {qx.ui.core.Widget} Item to query
     * @return {Integer} Right offset
     */
    getItemRight : function(item) {
      return this.getItemLeft(item) + item.getBounds().width;
    },





    /*
    ---------------------------------------------------------------------------
      DIMENSIONS
    ---------------------------------------------------------------------------
    */

    /**
     * The size (identical with the preferred size) of the content.
     *
     * @return {Map} Size of the content (keys: <code>width</code> and <code>height</code>)
     */
    getScrollSize : function() {
      return this.getChildren()[0].getBounds();
    },






    /*
    ---------------------------------------------------------------------------
      SCROLL SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * The maximum horizontal scroll position.
     *
     * @return {Integer} Maximum horizontal scroll position.
     */
    getScrollMaxX : function()
    {
      var paneSize = this.getInnerSize();
      var scrollSize = this.getScrollSize();

      if (paneSize && scrollSize) {
        return Math.max(0, scrollSize.width - paneSize.width);
      }

      return 0;
    },


    /**
     * The maximum vertical scroll position.
     *
     * @return {Integer} Maximum vertical scroll position.
     */
    getScrollMaxY : function()
    {
      var paneSize = this.getInnerSize();
      var scrollSize = this.getScrollSize();

      if (paneSize && scrollSize) {
        return Math.max(0, scrollSize.height - paneSize.height);
      }

      return 0;
    },


    /**
     * Scrolls the element's content to the given left coordinate
     *
     * @param value {Integer} The vertical position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollToX : function(value, duration)
    {
      var max = this.getScrollMaxX();

      if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }

      this.stopScrollAnimation();

      if (duration) {
        var from = this.getScrollX();
        this.__frame = new qx.bom.AnimationFrame();
        this.__frame.on("end", function() {
          this.setScrollX(value);
          this.__frame = null;
          this.fireEvent("scrollAnimationEnd");
        }, this);
        this.__frame.on("frame", function(timePassed) {
          var newX = parseInt(timePassed/duration * (value - from) + from);
          this.setScrollX(newX);
        }, this);
        this.__frame.startSequence(duration);

      } else {
        this.setScrollX(value);
      }
    },


    /**
     * Scrolls the element's content to the given top coordinate
     *
     * @param value {Integer} The horizontal position to scroll to.
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollToY : function(value, duration)
    {
      var max = this.getScrollMaxY();

      if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }

      this.stopScrollAnimation();

      if (duration) {
        var from = this.getScrollY();
        this.__frame = new qx.bom.AnimationFrame();
        this.__frame.on("end", function() {
          this.setScrollY(value);
          this.__frame = null;
          this.fireEvent("scrollAnimationEnd");
        }, this);
        this.__frame.on("frame", function(timePassed) {
          var newY = parseInt(timePassed/duration * (value - from) + from);
          this.setScrollY(newY);
        }, this);
        this.__frame.startSequence(duration);

      } else {
        this.setScrollY(value);
      }
    },


    /**
     * Scrolls the element's content horizontally by the given amount.
     *
     * @param x {Integer?0} Amount to scroll
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollByX : function(x, duration) {
      this.scrollToX(this.getScrollX() + x, duration);
    },


    /**
     * Scrolls the element's content vertically by the given amount.
     *
     * @param y {Integer?0} Amount to scroll
     * @param duration {Number?} The time in milliseconds the scroll to should take.
     */
    scrollByY : function(y, duration) {
      this.scrollToY(this.getScrollY() + y, duration);
    },


    /**
     * If an scroll animation is running, it will be stopped with that method.
     */
    stopScrollAnimation : function() {
      if (this.__frame) {
        this.__frame.cancelSequence();
        this.__frame = null;
      }
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyScrollX : function(value) {
      this.getContentElement().scrollToX(value);
    },


    // property apply
    _applyScrollY : function(value) {
      this.getContentElement().scrollToY(value);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * The grow layout stretches all children to the full available size
 * but still respects limits configured by min/max values.
 *
 * It will place all children over each other with the top and left coordinates
 * set to <code>0</code>. The {@link qx.ui.container.Stack} and the
 * {@link qx.ui.core.scroll.ScrollPane} are using this layout.
 *
 * *Features*
 *
 * * Auto-sizing
 * * Respects minimum and maximum child dimensions
 *
 * *Item Properties*
 *
 * None
 *
 * *Example*
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.Grow();
 *
 * var w1 = new qx.ui.core.Widget();
 * var w2 = new qx.ui.core.Widget();
 * var w3 = new qx.ui.core.Widget();
 *
 * var container = new qx.ui.container.Composite(layout);
 * container.add(w1);
 * container.add(w2);
 * container.add(w3);
 * </pre>
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/grow.html'>
 * Extended documentation</a> and links to demos of this layout in the qooxdoo manual.
 */
qx.Class.define("qx.ui.layout.Grow",
{
  extend : qx.ui.layout.Abstract,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value) {
        this.assert(false, "The property '"+name+"' is not supported by the Grow layout!");
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight, padding)
    {
      var children = this._getLayoutChildren();
      var child, size, width, height;

      // Render children
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        size = child.getSizeHint();

        width = availWidth;
        if (width < size.minWidth) {
          width = size.minWidth;
        } else if (width > size.maxWidth) {
          width = size.maxWidth;
        }

        height = availHeight;
        if (height < size.minHeight) {
          height = size.minHeight;
        } else if (height > size.maxHeight) {
          height = size.maxHeight;
        }

        child.renderLayout(padding.left, padding.top, width, height);
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      var children = this._getLayoutChildren();
      var child, size;
      var neededWidth=0, neededHeight=0;
      var minWidth=0, minHeight=0;
      var maxWidth=Infinity, maxHeight=Infinity;

      // Iterate over children
      for (var i=0, l=children.length; i<l; i++)
      {
        child = children[i];
        size = child.getSizeHint();

        neededWidth = Math.max(neededWidth, size.width);
        neededHeight = Math.max(neededHeight, size.height);

        minWidth = Math.max(minWidth, size.minWidth);
        minHeight = Math.max(minHeight, size.minHeight);

        maxWidth = Math.min(maxWidth, size.maxWidth);
        maxHeight = Math.min(maxHeight, size.maxHeight);
      }


      // Return hint
      return {
        width : neededWidth,
        height : neededHeight,

        minWidth : minWidth,
        minHeight : minHeight,

        maxWidth : maxWidth,
        maxHeight : maxHeight
      };
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This class is responsible for checking the scrolling behavior of the client.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Scroll",
{
  statics :
  {
    /**
     * Check if the scrollbars should be positioned on top of the content. This
     * is true of OSX Lion when the scrollbars disappear automatically.
     *
     * @internal
     *
     * @return {Boolean} <code>true</code> if the scrollbars should be
     *   positioned on top of the content.
     */
    scrollBarOverlayed : function() {
      var scrollBarWidth = qx.bom.element.Scroll.getScrollbarWidth();
      var osx = qx.bom.client.OperatingSystem.getName() === "osx";
      var nativeScrollBars = qx.core.Environment.get("qx.nativeScrollBars");

      return scrollBarWidth === 0 && osx && nativeScrollBars;
    },


    /**
     * Checks if native scroll can be used for the current mobile device.
     *
     * @internal
     *
     * @return {Boolean} <code>true</code> if the current device is capable to
     * use native scroll.
     */
    getNativeScroll : function()
    {
      // iOS 5+
      if (qx.core.Environment.get("os.name") == "ios" &&
        parseInt(qx.core.Environment.get("browser.version"), 10) > 4) {
        return true;
      }

      // Firefox
      if (qx.core.Environment.get("browser.name") == "firefox") {
        return true;
      }

      // Android 4.4+
      if (qx.core.Environment.get("os.name") == "android")
      {
        var osVersion = qx.core.Environment.get("os.version");
        var splitVersion = osVersion.split(".");
        if (splitVersion[0] > 4 ||
            (splitVersion.length > 1 && splitVersion[0] > 3 && splitVersion[1] > 3)) {
          return true;
        }
      }

      // IE 10+
      if (qx.core.Environment.get("event.mspointer")) {
        return true;
      }

      return false;
    }
  },


  defer : function(statics) {
    qx.core.Environment.add("os.scrollBarOverlayed", statics.scrollBarOverlayed);
    qx.core.Environment.add("qx.mobile.nativescroll", statics.getNativeScroll);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * The Scroller wraps a {@link Pane} and provides scroll bars to interactively
 * scroll the pane's content.
 *
 * @childControl pane {qx.ui.virtual.core.Pane} Virtual pane.
 */
qx.Class.define("qx.ui.virtual.core.Scroller",
{
  extend : qx.ui.core.scroll.AbstractScrollArea,


  /**
   * @param rowCount {Integer?0} The number of rows of the virtual grid.
   * @param columnCount {Integer?0} The number of columns of the virtual grid.
   * @param cellHeight {Integer?10} The default cell height.
   * @param cellWidth {Integer?10} The default cell width.
   */
  construct : function(rowCount, columnCount, cellHeight, cellWidth)
  {
    this.base(arguments);

    this.__pane = new qx.ui.virtual.core.Pane(rowCount, columnCount, cellHeight, cellWidth);
    this.__pane.addListener("update", this._computeScrollbars, this);
    this.__pane.addListener("scrollX", this._onScrollPaneX, this);
    this.__pane.addListener("scrollY", this._onScrollPaneY, this);

    if (qx.core.Environment.get("os.scrollBarOverlayed")) {
      this._add(this.__pane, {edge: 0});
    } else {
      this._add(this.__pane, {row: 0, column: 0});
    }

  },


  properties :
  {
    // overridden
    width :
    {
      refine : true,
      init : null
    },


    // overridden
    height :
    {
      refine : true,
      init : null
    }
  },


  members :
  {
    /** @type {Pane} Virtual pane. */
    __pane : null,


    /*
    ---------------------------------------------------------------------------
      ACCESSOR METHODS
    ---------------------------------------------------------------------------
    */


    /**
     * Get the scroller's virtual pane.
     *
     * @return {Pane} The scroller's pane.
     */
    getPane : function() {
      return this.__pane;
    },


    /*
    ---------------------------------------------------------------------------
      CHILD CONTROL SUPPORT
    ---------------------------------------------------------------------------
    */


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      if (id == "pane") {
        return this.__pane;
      } else {
        return this.base(arguments, id);
      }
    },


    /*
    ---------------------------------------------------------------------------
      ITEM LOCATION SUPPORT
    ---------------------------------------------------------------------------
    */


    /**
     * NOT IMPLEMENTED
     *
     * @param item {qx.ui.core.Widget} Item to query.
     * @return {Integer} Top offset.
     * @abstract
     */
    getItemTop : function(item)
    {
      throw new Error("The method 'getItemTop' is not implemented!");
    },


    /**
     * NOT IMPLEMENTED
     *
     * @param item {qx.ui.core.Widget} Item to query.
     * @return {Integer} Top offset.
     * @abstract
     */
    getItemBottom : function(item)
    {
      throw new Error("The method 'getItemBottom' is not implemented!");
    },


    /**
     * NOT IMPLEMENTED
     *
     * @param item {qx.ui.core.Widget} Item to query.
     * @return {Integer} Top offset.
     * @abstract
     */
    getItemLeft : function(item)
    {
      throw new Error("The method 'getItemLeft' is not implemented!");
    },


    /**
     * NOT IMPLEMENTED
     *
     * @param item {qx.ui.core.Widget} Item to query.
     * @return {Integer} Right offset.
     * @abstract
     */
    getItemRight : function(item)
    {
      throw new Error("The method 'getItemRight' is not implemented!");
    },


    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */


    // overridden
    _onScrollBarX : function(e) {
      this.__pane.setScrollX(e.getData());
    },


    // overridden
    _onScrollBarY : function(e) {
      this.__pane.setScrollY(e.getData());
    }
  },


  destruct : function()
  {
    this.__pane.dispose();
    this.__pane = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Interface describes the methods which the {@link qx.ui.tree.provider.WidgetProvider}
 * uses for communication.
 */
qx.Interface.define("qx.ui.tree.core.IVirtualTree",
{
  members :
  {
    /**
     * Return whether top level items should have an open/close button. The top
     * level item item is normally the root item, but when the root is hidden,
     * the root children are the top level items.
     *
     * @return {Boolean} Returns <code>true</code> when top level items should
     *   show open/close buttons, <code>false</code> otherwise.
     */
    isShowTopLevelOpenCloseIcons : function() {},


    /**
     * Returns the internal data structure. The Array index is the row and the
     * value is the model item.
     *
     * @internal
     * @return {qx.data.Array} The internal data structure.
     */
    getLookupTable : function() {},


    /**
     * Returns if the passed item is a note or a leaf.
     *
     * @internal
     * @param item {qx.core.Object} Item to check.
     * @return {Boolean} <code>True</code> when item is a node,
     *   </code>false</code> when item is a leaf.
     */
    isNode : function(item)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInterface(item, qx.core.Object);
    },


    /**
     * Return whether the node is opened or closed.
     *
     * @param node {qx.core.Object} Node to check.
     * @return {Boolean} Returns <code>true</code> when the node is opened,
     *   <code>false</code> otherwise.
     */
    isNodeOpen : function(node)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInterface(node, qx.core.Object);
    },


    /**
     * Returns the row's nesting level.
     *
     * @param row {Integer} The row to get the nesting level.
     * @return {Integer} The row's nesting level or <code>null</code>.
     */
    getLevel : function(row)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInteger(row);
    },


    /**
     * Return whether the node has visible children or not.
     *
     * @internal
     * @param node {qx.core.Object} Node to check.
     * @return {Boolean} <code>True</code> when the node has visible children,
     *   <code>false</code> otherwise.
     */
    hasChildren : function(node)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInterface(node, qx.core.Object);
    },


    /**
     * Opens the passed node.
     *
     * @param node {qx.core.Object} Node to open.
     */
    openNode : function(node)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInterface(node, qx.core.Object);
    },


    /**
     * Closes the passed node.
     *
     * @param node {qx.core.Object} Node to close.
     */
    closeNode : function(node)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInterface(node, qx.core.Object);
    },

    /**
     * Returns the current selection.
     *
     * @return {qx.data.Array} The current selected elements.
     */
    getSelection : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This mixin defines the <code>contentPadding</code> property, which is used
 * by widgets like the window or group box, which must have a property, which
 * defines the padding of an inner pane.
 *
 * The including class must implement the method
 * <code>_getContentPaddingTarget</code>, which must return the widget on which
 * the padding should be applied.
 */
qx.Mixin.define("qx.ui.core.MContentPadding",
{
  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Top padding of the content pane */
    contentPaddingTop :
    {
      check : "Integer",
      init : 0,
      apply : "_applyContentPadding",
      themeable : true
    },

    /** Right padding of the content pane */
    contentPaddingRight :
    {
      check : "Integer",
      init : 0,
      apply : "_applyContentPadding",
      themeable : true
    },

    /** Bottom padding of the content pane */
    contentPaddingBottom :
    {
      check : "Integer",
      init : 0,
      apply : "_applyContentPadding",
      themeable : true
    },

    /** Left padding of the content pane */
    contentPaddingLeft :
    {
      check : "Integer",
      init : 0,
      apply : "_applyContentPadding",
      themeable : true
    },

    /**
     * The 'contentPadding' property is a shorthand property for setting 'contentPaddingTop',
     * 'contentPaddingRight', 'contentPaddingBottom' and 'contentPaddingLeft'
     * at the same time.
     *
     * If four values are specified they apply to top, right, bottom and left respectively.
     * If there is only one value, it applies to all sides, if there are two or three,
     * the missing values are taken from the opposite side.
     */
    contentPadding :
    {
      group : [
        "contentPaddingTop", "contentPaddingRight",
        "contentPaddingBottom", "contentPaddingLeft"
      ],
      mode  : "shorthand",
      themeable : true
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * @type {Map} Maps property names of content padding to the setter of the padding
     *
     * @lint ignoreReferenceField(__contentPaddingSetter)
     */
    __contentPaddingSetter :
    {
      contentPaddingTop : "setPaddingTop",
      contentPaddingRight : "setPaddingRight",
      contentPaddingBottom : "setPaddingBottom",
      contentPaddingLeft : "setPaddingLeft"
    },


    /**
     * @type {Map} Maps property names of content padding to the themed setter of the padding
     *
     * @lint ignoreReferenceField(__contentPaddingThemedSetter)
     */
    __contentPaddingThemedSetter :
    {
      contentPaddingTop : "setThemedPaddingTop",
      contentPaddingRight : "setThemedPaddingRight",
      contentPaddingBottom : "setThemedPaddingBottom",
      contentPaddingLeft : "setThemedPaddingLeft"
    },


    /**
     * @type {Map} Maps property names of content padding to the resetter of the padding
     *
     * @lint ignoreReferenceField(__contentPaddingResetter)
     */
    __contentPaddingResetter :
    {
      contentPaddingTop : "resetPaddingTop",
      contentPaddingRight : "resetPaddingRight",
      contentPaddingBottom : "resetPaddingBottom",
      contentPaddingLeft : "resetPaddingLeft"
    },


    // property apply
    _applyContentPadding : function(value, old, name, variant)
    {
      var target = this._getContentPaddingTarget();

      if (value == null)
      {
        var resetter = this.__contentPaddingResetter[name];
        target[resetter]();
      }
      else
      {
        // forward the themed sates if case the apply was invoked by a theme
        if (variant == "setThemed" || variant == "resetThemed") {
          var setter = this.__contentPaddingThemedSetter[name];
          target[setter](value);
        } else {
          var setter = this.__contentPaddingSetter[name];
          target[setter](value);
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Interface for data binding classes offering a selection.
 */
qx.Interface.define("qx.data.controller.ISelection",
{
  members :
  {
    /**
     * Setter for the selection.
     * @param value {qx.data.IListData} The data of the selection.
     */
    setSelection : function(value) {},


    /**
     * Getter for the selection list.
     * @return {qx.data.IListData} The current selection.
     */
    getSelection : function() {},


    /**
     * Resets the selection to its default value.
     */
    resetSelection : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Virtual tree implementation.
 *
 * The virtual tree can be used to render node and leafs. Nodes and leafs are
 * both items for a tree. The difference between a node and a leaf is that a
 * node has child items, but a leaf not.
 *
 * With the {@link qx.ui.tree.core.IVirtualTreeDelegate} interface it is possible
 * to configure the tree's behavior (item renderer configuration, etc.).
 *
 * Here's an example of how to use the widget:
 * <pre class="javascript">
 * //create the model data
 * var nodes = [];
 * for (var i = 0; i < 2500; i++)
 * {
 *   nodes[i] = {name : "Item " + i};
 *
 *   // if its not the root node
 *   if (i !== 0)
 *   {
 *     // add the children in some random order
 *     var node = nodes[parseInt(Math.random() * i)];
 *
 *     if(node.children == null) {
 *       node.children = [];
 *     }
 *     node.children.push(nodes[i]);
 *   }
 * }
 *
 * // converts the raw nodes to qooxdoo objects
 * nodes = qx.data.marshal.Json.createModel(nodes, true);
 *
 * // creates the tree
 * var tree = new qx.ui.tree.VirtualTree(nodes.getItem(0), "name", "children").set({
 *   width : 200,
 *   height : 400
 * });
 *
 * //log selection changes
 * tree.getSelection().addListener("change", function(e) {
 *   this.debug("Selection: " + tree.getSelection().getItem(0).getName());
 * }, this);
 * </pre>
 */
qx.Class.define("qx.ui.tree.VirtualTree",
{
  extend : qx.ui.virtual.core.Scroller,
  implement : [qx.ui.tree.core.IVirtualTree, qx.data.controller.ISelection],
  include : [
    qx.ui.virtual.selection.MModel,
    qx.ui.core.MContentPadding
  ],

  /**
   * @param model {qx.core.Object?null} The model structure for the tree, for
   *   more details have a look at the 'model' property.
   * @param labelPath {String?null} The name of the label property, for more
   *   details have a look at the 'labelPath' property.
   * @param childProperty {String?null} The name of the child property, for
   *   more details have a look at the 'childProperty' property.
   */
  construct : function(model, labelPath, childProperty)
  {
    this.base(arguments, 0, 1, 20, 100);

    this._init();

    if (labelPath != null) {
      this.setLabelPath(labelPath);
    }

    if (childProperty != null) {
      this.setChildProperty(childProperty);
    }

    if(model != null) {
      this.initModel(model);
    }

    this.initItemHeight();
    this.initOpenMode();

    this.addListener("keypress", this._onKeyPress, this);
  },

  events :
  {
    /**
     * Fired when a node is opened.
     */
    open : "qx.event.type.Data",


    /**
     * Fired when a node is closed.
     */
    close : "qx.event.type.Data"
  },


  properties :
  {
    // overridden
    appearance :
    {
      refine: true,
      init: "virtual-tree"
    },


    // overridden
    focusable :
    {
      refine: true,
      init: true
    },


    // overridden
    width :
    {
      refine : true,
      init : 100
    },


    // overridden
    height :
    {
      refine : true,
      init : 200
    },


    /** Default item height. */
    itemHeight :
    {
      check : "Integer",
      init : 25,
      apply : "_applyRowHeight",
      themeable : true
    },


    /**
     * Control whether tap or double tap should open or close the tapped
     * item.
     */
    openMode :
    {
      check: ["tap", "dbltap", "none"],
      init: "dbltap",
      apply: "_applyOpenMode",
      event: "changeOpenMode",
      themeable: true
    },


    /**
     * Hides *only* the root node, not the node's children when the property is
     * set to <code>true</code>.
     */
    hideRoot :
    {
      check: "Boolean",
      init: false,
      apply:"_applyHideRoot"
    },


    /**
     * Whether top level items should have an open/close button. The top level
     * item item is normally the root item, but when the root is hidden, the
     * root children are the top level items.
     */
    showTopLevelOpenCloseIcons :
    {
      check : "Boolean",
      init : false,
      apply : "_applyShowTopLevelOpenCloseIcons"
    },


    /**
     * Configures the tree to show also the leafs. When the property is set to
     * <code>false</code> *only* the nodes are shown.
     */
    showLeafs :
    {
      check: "Boolean",
      init: true,
      apply: "_applyShowLeafs"
    },


    /**
     * The name of the property, where the children are stored in the model.
     * Instead of the {@link #labelPath} must the child property a direct
     * property form the model instance.
     */
    childProperty :
    {
      check: "String",
      apply: "_applyChildProperty",
      nullable: true
    },


    /**
     * The name of the property, where the value for the tree folders label
     * is stored in the model classes.
     */
    labelPath :
    {
      check: "String",
      apply: "_applyLabelPath",
      nullable: true
    },


    /**
     * The path to the property which holds the information that should be
     * shown as an icon.
     */
    iconPath :
    {
      check: "String",
      apply: "_applyIconPath",
      nullable: true
    },


    /**
     * A map containing the options for the label binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    labelOptions :
    {
      apply: "_applyLabelOptions",
      nullable: true
    },


    /**
     * A map containing the options for the icon binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    iconOptions :
    {
      apply: "_applyIconOptions",
      nullable: true
    },


    /**
     * The model containing the data (nodes and/or leafs) which should be shown
     * in the tree.
     */
    model :
    {
      check : "qx.core.Object",
      apply : "_applyModel",
      event: "changeModel",
      nullable : true,
      deferredInit : true
    },


    /**
     * Delegation object, which can have one or more functions defined by the
     * {@link qx.ui.tree.core.IVirtualTreeDelegate} interface.
     */
    delegate :
    {
      event: "changeDelegate",
      apply: "_applyDelegate",
      init: null,
      nullable: true
    }
  },


  members :
  {
    /** @type {qx.ui.tree.provider.WidgetProvider} Provider for widget rendering. */
    _provider : null,


    /** @type {qx.ui.virtual.layer.Abstract} Layer which contains the items. */
    _layer : null,


    /**
     * @type {qx.data.Array} The internal lookup table data structure to get the model item
     * from a row.
     */
    __lookupTable : null,


    /** @type {Array} HashMap which contains all open nodes. */
    __openNodes : null,


    /**
     * @type {Array} The internal data structure to get the nesting level from a
     * row.
     */
    __nestingLevel : null,


    /**
     * @type {qx.util.DeferredCall} Adds this instance to the widget queue on a
     * deferred call.
     */
    __deferredCall : null,


    /** @type {Integer} Holds the max item width from a rendered widget. */
    _itemWidth : 0,


    /** @type {Array} internal parent chain form the last selected node */
    __parentChain : null,


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */


    // overridden
    syncWidget : function(jobs)
    {
      var firstRow = this._layer.getFirstRow();
      var rowSize = this._layer.getRowSizes().length;

      for (var row = firstRow; row < firstRow + rowSize; row++)
      {
        var widget = this._layer.getRenderedCellWidget(row, 0);
        if (widget != null) {
          this._itemWidth = Math.max(this._itemWidth, widget.getSizeHint().width);
        }
      }
      var paneWidth = this.getPane().getInnerSize().width;
      this.getPane().getColumnConfig().setItemSize(0, Math.max(this._itemWidth, paneWidth));
    },


    // Interface implementation
    openNode : function(node)
    {
      this.__openNode(node);
      this.buildLookupTable();
    },


    /**
     * Trigger a rebuild from the internal data structure.
     */
    refresh : function() {
      this.buildLookupTable();
    },


    /**
     * Opens the passed node and all his parents. *Note!* The algorithm
     * implements a depth-first search with a complexity: <code>O(n)</code> and
     * <code>n</code> are all model items.
     *
     * @param node {qx.core.Object} Node to open.
     */
    openNodeAndParents : function(node)
    {
      this.__openNodeAndAllParents(this.getModel(), node);
      this.buildLookupTable();
    },


    // Interface implementation
    closeNode : function(node)
    {
      if (qx.lang.Array.contains(this.__openNodes, node))
      {
        qx.lang.Array.remove(this.__openNodes, node);
        this.fireDataEvent("close", node);
        this.buildLookupTable();
      }
    },


    // Interface implementation
    isNodeOpen : function(node) {
      return qx.lang.Array.contains(this.__openNodes, node);
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL API
    ---------------------------------------------------------------------------
    */


    /**
     * Initializes the virtual tree.
     */
    _init : function()
    {
      this.__lookupTable = new qx.data.Array();
      this.__openNodes = [];
      this.__nestingLevel = [];
      this._initLayer();
    },


    /**
     * Initializes the virtual tree layer.
     */
    _initLayer : function()
    {
      this._provider = new qx.ui.tree.provider.WidgetProvider(this);
      this._layer = this._provider.createLayer();
      this._layer.addListener("updated", this._onUpdated, this);
      this.getPane().addLayer(this._layer);
      this.getPane().addListenerOnce("resize", function(e) {
        // apply width to pane on first rendering pass
        // to avoid visible flickering
        this.getPane().getColumnConfig().setItemSize(0, e.getData().width);
      }, this);
    },


    // Interface implementation
    getLookupTable : function() {
      return this.__lookupTable;
    },


    /**
     * Performs a lookup from model index to row.
     *
     * @param index {Number} The index to look at.
     * @return {Number} The row or <code>-1</code>
     *  if the index is not a model index.
     */
    _reverseLookup : function(index) {
      return index;
    },


    /**
     * Returns the model data for the given row.
     *
     * @param row {Integer} row to get data for.
     * @return {var|null} the row's model data.
     */
    _getDataFromRow : function(row) {
      return this.__lookupTable.getItem(row);
    },

    /**
     * Returns the selectable model items.
     *
     * @return {qx.data.Array} The selectable items.
     */
    _getSelectables : function() {
      return this.__lookupTable;
    },


    /**
     * Returns all open nodes.
     *
     * @internal
     * @return {Array} All open nodes.
     */
    getOpenNodes : function() {
      return this.__openNodes;
    },


    // Interface implementation
    isNode : function(item) {
      return qx.ui.tree.core.Util.isNode(item, this.getChildProperty());
    },


    // Interface implementation
    getLevel : function(row) {
      return this.__nestingLevel[row];
    },


    // Interface implementation
    hasChildren : function(node) {
      return qx.ui.tree.core.Util.hasChildren(node, this.getChildProperty(), !this.isShowLeafs());
    },


    /**
     * Returns the element, to which the content padding should be applied.
     *
     * @return {qx.ui.core.Widget} The content padding target.
     */
    _getContentPaddingTarget : function() {
      return this.getPane();
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY METHODS
    ---------------------------------------------------------------------------
    */


    // property apply
    _applyRowHeight : function(value, old) {
      this.getPane().getRowConfig().setDefaultItemSize(value);
    },


    // property apply
    _applyOpenMode : function(value, old)
    {
      var pane = this.getPane();

      //"tap", "dbltap", "none"
      if (value === "dbltap") {
        pane.addListener("cellDbltap", this._onOpen, this);
      } else if (value === "tap") {
        pane.addListener("cellTap", this._onOpen, this);
      }

      if (old === "dbltap") {
        pane.removeListener("cellDbltap", this._onOpen, this);
      } else if (old === "tap") {
        pane.removeListener("cellTap", this._onOpen, this);
      }
    },


    // property apply
    _applyHideRoot : function(value, old) {
      this.buildLookupTable();
    },


    // property apply
    _applyShowTopLevelOpenCloseIcons : function(value, old) {
      this.buildLookupTable();
    },


    // property apply
    _applyShowLeafs : function(value, old) {
      this.buildLookupTable();
    },


    // property apply
    _applyChildProperty : function(value, old) {
      this._provider.setChildProperty(value);
    },


    // property apply
    _applyLabelPath : function(value, old) {
      this._provider.setLabelPath(value);
    },


    // property apply
    _applyIconPath : function(value, old) {
      this._provider.setIconPath(value);
    },


    // property apply
    _applyLabelOptions : function(value, old) {
      this._provider.setLabelOptions(value);
    },


    // property apply
    _applyIconOptions : function(value, old) {
      this._provider.setIconOptions(value);
    },


    // property apply
    _applyModel : function(value, old)
    {
      this.__openNodes = [];

      if (value != null)
      {
        if (qx.core.Environment.get("qx.debug"))
        {
          if (!qx.Class.hasMixin(value.constructor,
                qx.data.marshal.MEventBubbling))
          {
            this.warn("The model item doesn't support the Mixin 'qx.data." +
              "marshal.MEventBubbling'. Therefore the tree can not update " +
              "the view automatically on model changes.");
          }
        }
        value.addListener("changeBubble", this._onChangeBubble, this);
        this.__openNode(value);
      }

      if (old != null) {
        old.removeListener("changeBubble", this._onChangeBubble, this);
      }

      this.__applyModelChanges();
    },


    // property apply
    _applyDelegate : function(value, old)
    {
      this._provider.setDelegate(value);
      this.buildLookupTable();
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLERS
    ---------------------------------------------------------------------------
    */


    /**
     * Event handler for the changeBubble event. The handler rebuild the lookup
     * table when the child structure changed.
     *
     * @param event {qx.event.type.Data} The data event.
     */
    _onChangeBubble : function(event)
    {
      var data = event.getData();
      var propertyName = data.name;
      var index = propertyName.lastIndexOf(".");

      if (index != -1) {
        propertyName = propertyName.substr(index + 1, propertyName.length);
      }

      // only continue when the effected property is the child property
      if (qx.lang.String.startsWith(propertyName, this.getChildProperty()))
      {
        var item = data.item;

        if (qx.Class.isSubClassOf(item.constructor, qx.data.Array))
        {
          if (index === -1)
          {
            item = this.getModel();
          }
          else
          {
            var propertyChain = data.name.substr(0, index);
            item = qx.data.SingleValueBinding.resolvePropertyChain(this.getModel(), propertyChain);
          }
        }

        if (this.__lookupTable.indexOf(item) != -1) {
          this.__applyModelChanges();
        }
      }
    },


    /**
     * Event handler for the update event.
     *
     * @param event {qx.event.type.Event} The event.
     */
    _onUpdated : function(event)
    {
      if (this.__deferredCall == null) {
        this.__deferredCall = new qx.util.DeferredCall(function() {
          qx.ui.core.queue.Widget.add(this);
        }, this);
      }
      this.__deferredCall.schedule();
    },


    /**
     * Event handler to open/close tapped nodes.
     *
     * @param event {qx.ui.virtual.core.CellEvent} The cell tap event.
     */
    _onOpen : function(event)
    {
      var row = event.getRow();
      var item = this.__lookupTable.getItem(row);

      if (this.isNode(item))
      {
        if (this.isNodeOpen(item)) {
          this.closeNode(item);
        } else {
          this.openNode(item);
        }
      }
    },


    /**
     * Event handler for key press events. Open and close the current selected
     * item on key left and right press. Jump to parent on key left if already
     * closed.
     *
     * @param e {qx.event.type.KeySequence} key event.
     */
    _onKeyPress : function(e)
    {
      var selection = this.getSelection();

      if (selection.getLength() > 0)
      {
        var item = selection.getItem(0);
        var isNode = this.isNode(item);

        switch(e.getKeyIdentifier())
        {
          case "Left":
            if (isNode && this.isNodeOpen(item)) {
              this.closeNode(item);
            } else {
              var parent = this.getParent(item);
              if (parent != null) {
                selection.splice(0, 1, parent);
              }
            }
            break;

          case "Right":
            if (isNode && !this.isNodeOpen(item)) {
              this.openNode(item);
            }
            else
            {
              if (isNode)
              {
                var children = item.get(this.getChildProperty());
                if (children != null && children.getLength() > 0) {
                  selection.splice(0, 1, children.getItem(0));
                }
              }
            }
            break;

          case "Enter":
          case "Space":
            if (!isNode) {
              return;
            }
            if (this.isNodeOpen(item)) {
              this.closeNode(item);
            } else {
              this.openNode(item);
            }
            break;
        }
      }
    },

    /*
    ---------------------------------------------------------------------------
      SELECTION HOOK METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Hook method which is called from the {@link qx.ui.virtual.selection.MModel}.
     * The hook method sets the first visible parent not as new selection when
     * the current selection is empty and the selection mode is one selection.
     *
     * @param newSelection {Array} The newSelection which will be set to the selection manager.
     */
    _beforeApplySelection : function(newSelection)
    {
      if (newSelection.length === 0 &&
          this.getSelectionMode() === "one")
      {
        var visibleParent = this.__getVisibleParent();
        var row = this.getLookupTable().indexOf(visibleParent);

        if (row >= 0) {
          newSelection.push(row);
        }
      }
    },


    /**
     * Hook method which is called from the {@link qx.ui.virtual.selection.MModel}.
     * The hook method builds the parent chain form the current selected item.
     */
    _afterApplySelection : function()
    {
      var selection = this.getSelection();

      if (selection.getLength() > 0 &&
          this.getSelectionMode() === "one") {
        this.__buildParentChain(selection.getItem(0));
      } else {
        this.__parentChain = [];
      }
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */


    /**
     * Helper method to apply model changes. Normally build the lookup table and
     * apply the default selection.
     */
    __applyModelChanges : function()
    {
      this.buildLookupTable();
      this._applyDefaultSelection();
    },


    /**
     * Helper method to build the internal data structure.
     *
     * @internal
     */
    buildLookupTable : function()
    {
      if (
        this.getModel() != null &&
        (this.getChildProperty() == null || this.getLabelPath() == null)
      )
      {
        throw new Error("Could not build tree, because 'childProperty' and/" +
          "or 'labelPath' is 'null'!");
      }

      this._itemWidth = 0;
      var lookupTable = [];
      this.__nestingLevel = [];
      var nestedLevel = -1;

      var root = this.getModel();
      if (root != null)
      {
        if (!this.isHideRoot())
        {
          nestedLevel++;
          lookupTable.push(root);
          this.__nestingLevel.push(nestedLevel);
        }

        if (this.isNodeOpen(root))
        {
          var visibleChildren = this.__getVisibleChildrenFrom(root, nestedLevel);
          lookupTable = lookupTable.concat(visibleChildren);
        }
      }

      if (!qx.lang.Array.equals(this.__lookupTable.toArray(), lookupTable))
      {
        this._provider.removeBindings();
        this.__lookupTable.removeAll();
        this.__lookupTable.append(lookupTable);
        this.__updateRowCount();
        this._updateSelection();
      }
    },


    /**
     * Helper method to get all visible children form the passed parent node.
     * The algorithm implements a depth-first search with a complexity:
     * <code>O(n)</code> and <code>n</code> are all visible items.
     *
     * @param node {qx.core.Object} The start node to start search.
     * @param nestedLevel {Integer} The nested level from the start node.
     * @return {Array} All visible children form the parent.
     */
    __getVisibleChildrenFrom : function(node, nestedLevel)
    {
      var visible = [];
      nestedLevel++;

      if (!this.isNode(node)) {
        return visible;
      }

      var children = node.get(this.getChildProperty());
      if (children == null) {
        return visible;
      }

      // clone children to keep original model unmodified
      children = children.copy();

      var delegate = this.getDelegate();
      var filter = qx.util.Delegate.getMethod(delegate, "filter");
      var sorter = qx.util.Delegate.getMethod(delegate, "sorter");

      if (sorter != null) {
        children.sort(sorter);
      }

      for (var i = 0; i < children.getLength(); i++)
      {
        var child = children.getItem(i);

        if (filter && !filter(child)) {
          continue;
        }

        if (this.isNode(child))
        {
          this.__nestingLevel.push(nestedLevel);
          visible.push(child);

          if (this.isNodeOpen(child))
          {
            var visibleChildren = this.__getVisibleChildrenFrom(child, nestedLevel);
            visible = visible.concat(visibleChildren);
          }
        }
        else
        {
          if (this.isShowLeafs())
          {
            this.__nestingLevel.push(nestedLevel);
            visible.push(child);
          }
        }
      }

      // dispose children clone
      children.dispose();

      return visible;
    },


    /**
     * Helper method to set the node to the open nodes data structure when it
     * is not included.
     *
     * @param node {qx.core.Object} Node to set to open nodes.
     */
    __openNode : function(node)
    {
      if (!qx.lang.Array.contains(this.__openNodes, node)) {
        this.__openNodes.push(node);
        this.fireDataEvent("open", node);
      }
    },


    /**
     * Helper method to set the target node and all his parents to the open
     * nodes data structure. The algorithm implements a depth-first search with
     * a complexity: <code>O(n)</code> and <code>n</code> are all model items.
     *
     * @param startNode {qx.core.Object} Start (root) node to search.
     * @param targetNode {qx.core.Object} Target node to open (and his parents).
     * @return {Boolean} <code>True</code> when the targetNode and his
     *  parents could opened, <code>false</code> otherwise.
     */
    __openNodeAndAllParents : function(startNode, targetNode)
    {
      if (startNode === targetNode)
      {
        this.__openNode(targetNode);
        return true;
      }

      if (!this.isNode(startNode)) {
        return false;
      }

      var children = startNode.get(this.getChildProperty());
      if (children == null) {
        return false;
      }

      for (var i = 0; i < children.getLength(); i++)
      {
        var child = children.getItem(i);
        var result = this.__openNodeAndAllParents(child, targetNode);

        if (result === true)
        {
          this.__openNode(child);
          return true;
        }
      }

      return false;
    },


    /**
     * Helper method to update the row count.
     */
    __updateRowCount : function()
    {
      this.getPane().getRowConfig().setItemCount(this.__lookupTable.getLength());
      this.getPane().fullUpdate();
    },


    /**
     * Helper method to get the parent node. Node! This only works with leaf and
     * nodes which are in the internal lookup table.
     *
     * @param item {qx.core.Object} Node or leaf to get parent.
     * @return {qx.core.Object|null} The parent note or <code>null</code> when
     *   no parent found.
     *
     * @internal
     */
    getParent : function(item)
    {
      var index = this.__lookupTable.indexOf(item);
      if (index < 0) {
        return null;
      }

      var level = this.__nestingLevel[index];
      while(index > 0)
      {
        index--;
        var levelBevore = this.__nestingLevel[index];
        if (levelBevore < level) {
          return this.__lookupTable.getItem(index);
        }
      }

      return null;
    },


    /**
     * Builds the parent chain form the passed item.
     *
     * @param item {var} Item to build parent chain.
     */
    __buildParentChain : function(item)
    {
      this.__parentChain = [];
      var parent = this.getParent(item);
      while(parent != null)
      {
        this.__parentChain.unshift(parent);
        parent = this.getParent(parent);
      }
    },


    /**
     * Return the first visible parent node from the last selected node.
     *
     * @return {var} The first visible node.
     */
    __getVisibleParent : function()
    {
      if (this.__parentChain == null) {
        return this.getModel();
      }

      var lookupTable = this.getLookupTable();
      var parent = this.__parentChain.pop();

      while(parent != null)
      {
        if (lookupTable.contains(parent)) {
          return parent;
        }
        parent = this.__parentChain.pop();
      }
      return this.getModel();
    }
  },


  destruct : function()
  {
    var pane = this.getPane()
    if (pane != null)
    {
      if (pane.hasListener("cellDbltap")) {
        pane.removeListener("cellDbltap", this._onOpen, this);
      }
      if (pane.hasListener("cellTap")) {
        pane.removeListener("cellTap", this._onOpen, this);
      }
    }

    if (!qx.core.ObjectRegistry.inShutDown && this.__deferredCall != null)
    {
      this.__deferredCall.cancel();
      this.__deferredCall.dispose();
    }

    var model = this.getModel();
    if (model != null) {
      model.removeListener("changeBubble", this._onChangeBubble, this);
    }

    this._layer.removeListener("updated", this._onUpdated, this);
    this._layer.destroy();
    this._provider.dispose();
    this.__lookupTable.dispose();

    this._layer = this._provider = this.__lookupTable = this.__openNodes =
      this.__deferredCall = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Methods to work with the delegate pattern.
 */
qx.Class.define("qx.util.Delegate",
{
  statics :
  {
    /**
     * Returns the delegate method given my its name.
     *
     * @param delegate {Object} The delegate object to check the method.
     * @param specificMethod {String} The name of the delegate method.
     * @return {Function|null} The requested method or null, if no method is set.
     */
    getMethod : function(delegate, specificMethod)
    {
      if (qx.util.Delegate.containsMethod(delegate, specificMethod)) {
        return qx.lang.Function.bind(delegate[specificMethod], delegate);
      }

      return null;
    },



    /**
     * Checks, if the given delegate is valid or if a specific method is given.
     *
     * @param delegate {Object} The delegate object.
     * @param specificMethod {String} The name of the method to search for.
     * @return {Boolean} True, if everything was ok.
     */
    containsMethod : function (delegate, specificMethod)
    {
      var Type = qx.lang.Type;

      if (Type.isObject(delegate)) {
        return Type.isFunction(delegate[specificMethod]);
      }

      return false;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * A widget cell provider provides the {@link qx.ui.virtual.layer.WidgetCell}
 * with configured widgets to render the cells and pools/releases unused
 * cell widgets.
 */
qx.Interface.define("qx.ui.virtual.core.IWidgetCellProvider",
{
  members :
  {
    /**
     * This method returns the configured cell for the given cell. The return
     * value may be <code>null</code> to indicate that the cell should be empty.
     *
     * @param row {Integer} The cell's row index.
     * @param column {Integer} The cell's column index.
     * @return {qx.ui.core.LayoutItem} The configured widget for the given cell.
     */
    getCellWidget : function(row, column) {},

    /**
     * Release the given cell widget. Either pool or destroy the widget.
     *
     * @param widget {qx.ui.core.LayoutItem} The cell widget to pool.
     */
    poolCellWidget : function(widget) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This interface needs to implemented from all {@link qx.ui.tree.VirtualTree}
 * providers.
 *
 * @internal
 */
qx.Interface.define("qx.ui.tree.provider.IVirtualTreeProvider",
{
  members :
  {
    /**
     * Creates a layer for node and leaf rendering.
     *
     * @return {qx.ui.virtual.layer.Abstract} new layer.
     */
    createLayer : function() {},


    /**
     * Creates a renderer for rendering.
     *
     * @return {var} new node renderer.
     */
    createRenderer : function() {},


    /**
     * Sets the name of the property, where the children are stored in the model.
     *
     * @param value {String} The child property name.
     */
    setChildProperty : function(value)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertString(value);
    },


    /**
     * Sets the name of the property, where the value for the tree folders label
     * is stored in the model classes.
     *
     * @param value {String} The label path.
     */
    setLabelPath : function(value)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertString(value);
    },


    /**
     * Styles a selected item.
     *
     * @param row {Integer} row to style.
     */
    styleSelectabled : function(row)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInteger(row);
    },


    /**
     * Styles a not selected item.
     *
     * @param row {Integer} row to style.
     */
    styleUnselectabled : function(row)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInteger(row);
    },


    /**
     * Returns if the passed row can be selected or not.
     *
     * @param row {Integer} row to select.
     * @return {Boolean} <code>true</code> when the row can be selected,
     *    <code>false</code> otherwise.
     */
    isSelectable : function(row)
    {
      this.assertArgumentsCount(arguments, 1, 1);
      this.assertInteger(row);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The mixin controls the binding between model and item.
 *
 * @internal
 */
qx.Mixin.define("qx.ui.tree.core.MWidgetController",
{
  construct : function() {
    this.__boundItems = [];
  },


  properties :
  {
    /**
     * The name of the property, where the value for the tree node/leaf label
     * is stored in the model classes.
     */
    labelPath :
    {
      check: "String",
      nullable: true
    },


    /**
     * The path to the property which holds the information that should be
     * shown as an icon.
     */
    iconPath :
    {
      check: "String",
      nullable: true
    },


    /**
     * A map containing the options for the label binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    labelOptions :
    {
      nullable: true
    },


    /**
     * A map containing the options for the icon binding. The possible keys
     * can be found in the {@link qx.data.SingleValueBinding} documentation.
     */
    iconOptions :
    {
      nullable: true
    },


    /**
     * The name of the property, where the children are stored in the model.
     * Instead of the {@link #labelPath} must the child property a direct
     * property form the model instance.
     */
    childProperty :
    {
      check: "String",
      nullable: true
    },


    /**
     * Delegation object, which can have one or more functions defined by the
     * {@link qx.ui.tree.core.IVirtualTreeDelegate} interface.
     */
    delegate :
    {
      event: "changeDelegate",
      init: null,
      nullable: true
    }
  },


  members :
  {
    /** @type {Array} which contains the bounded items */
    __boundItems : null,


    /**
     * Helper-Method for binding the default properties from the model to the
     * target widget. The used default properties  depends on the passed item.
     *
     * This method should only be called in the {@link IVirtualTreeDelegate#bindItem}
     * function implemented by the {@link #delegate} property.
     *
     * @param item {qx.ui.core.Widget} The internally created and used node or
     *   leaf.
     * @param index {Integer} The index of the item (node or leaf).
     */
    bindDefaultProperties : function(item, index)
    {
      // bind model first
      this.bindProperty("", "model", null, item, index);

      this.bindProperty(
        this.getLabelPath(), "label", this.getLabelOptions(), item, index
      );

      try
      {
        this.bindProperty(
          this.getChildProperty() + ".length", "appearance",
          {
            converter : function() {
              return "virtual-tree-folder";
            }
          }, item, index
        );
      } catch(ex) {
        item.setAppearance("virtual-tree-file");
      }

      if (this.getIconPath() != null)
      {
        this.bindProperty(
          this.getIconPath(), "icon", this.getIconOptions(), item, index
        );
      }
    },


    /**
     * Helper-Method for binding a given property from the model to the target
     * widget.
     *
     * This method should only be called in the {@link IVirtualTreeDelegate#bindItem}
     * function implemented by the {@link #delegate} property.
     *
     * @param sourcePath {String | null} The path to the property in the model.
     *   If you use an empty string, the whole model item will be bound.
     * @param targetProperty {String} The name of the property in the target widget.
     * @param options {Map | null} The options to use for the binding.
     * @param targetWidget {qx.ui.core.Widget} The target widget.
     * @param index {Integer} The index of the current binding.
     */
    bindProperty : function(sourcePath, targetProperty, options, targetWidget, index)
    {
      var bindPath = this.__getBindPath(index, sourcePath);
      var bindTarget = this._tree.getLookupTable();

      var id = bindTarget.bind(bindPath, targetWidget, targetProperty, options);
      this.__addBinding(targetWidget, id);
    },


    /**
     * Helper-Method for binding a given property from the target widget to
     * the model.
     * This method should only be called in the
     * {@link qx.ui.tree.core.IVirtualTreeDelegate#bindItem} function implemented by the
     * {@link #delegate} property.
     *
     * @param targetPath {String | null} The path to the property in the model.
     * @param sourceProperty {String} The name of the property in the target.
     * @param options {Map | null} The options to use for the binding.
     * @param sourceWidget {qx.ui.core.Widget} The source widget.
     * @param index {Integer} The index of the current binding.
     */
    bindPropertyReverse : function(targetPath, sourceProperty, options, sourceWidget, index)
    {
      var bindPath = this.__getBindPath(index, targetPath);
      var bindTarget = this._tree.getLookupTable();

      var id = sourceWidget.bind(sourceProperty, bindTarget, bindPath, options);
      this.__addBinding(sourceWidget, id);
    },


    /**
     * Remove all bindings from all bounded items.
     */
    removeBindings : function()
    {
      while(this.__boundItems.length > 0) {
        var item = this.__boundItems.pop();
        this._removeBindingsFrom(item);
      }
    },


    /**
     * Sets up the binding for the given item and index.
     *
     * @param item {qx.ui.core.Widget} The internally created and used item.
     * @param index {Integer} The index of the item.
     */
    _bindItem : function(item, index)
    {
      var bindItem = qx.util.Delegate.getMethod(this.getDelegate(), "bindItem");

      if (bindItem != null) {
        bindItem(this, item, index);
      } else {
        this.bindDefaultProperties(item, index);
      }
    },


    /**
     * Removes the binding of the given item.
     *
     * @param item {qx.ui.core.Widget} The item which the binding should be
     *   removed.
     */
    _removeBindingsFrom : function(item)
    {
      var bindings = this.__getBindings(item);

      while (bindings.length > 0)
      {
        var id = bindings.pop();

        try {
          this._tree.getLookupTable().removeBinding(id);
        } catch(e) {
          item.removeBinding(id);
        }
      }

      if (qx.lang.Array.contains(this.__boundItems, item)) {
        qx.lang.Array.remove(this.__boundItems, item);
      }
    },


    /**
     * Helper method to create the path for binding.
     *
     * @param index {Integer} The index of the item.
     * @param path {String|null} The path to the property.
     * @return {String} The binding path
     */
    __getBindPath : function(index, path)
    {
      var bindPath = "[" + index + "]";
      if (path != null && path != "") {
        bindPath += "." + path;
      }
      return bindPath;
    },


    /**
     * Helper method to save the binding for the widget.
     *
     * @param widget {qx.ui.core.Widget} widget to save binding.
     * @param id {var} the id from the binding.
     */
    __addBinding : function(widget, id)
    {
      var bindings = this.__getBindings(widget);

      if (!qx.lang.Array.contains(bindings, id)) {
        bindings.push(id);
      }

      if (!qx.lang.Array.contains(this.__boundItems, widget)) {
        this.__boundItems.push(widget);
      }
    },


    /**
     * Helper method which returns all bound id from the widget.
     *
     * @param widget {qx.ui.core.Widget} widget to get all binding.
     * @return {Array} all bound id's.
     */
    __getBindings : function(widget)
    {
      var bindings = widget.getUserData("BindingIds");

      if (bindings == null) {
        bindings = [];
        widget.setUserData("BindingIds", bindings);
      }

      return bindings;
    }
  },


  destruct : function() {
    this.__boundItems = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * The provider implements the {@link qx.ui.virtual.core.IWidgetCellProvider}
 * API, which can be used as delegate for the widget cell rendering and it
 * provides a API to bind the model with the rendered item.
 *
 * @internal
 */
qx.Class.define("qx.ui.tree.provider.WidgetProvider",
{
  extend : qx.core.Object,

  implement : [
   qx.ui.virtual.core.IWidgetCellProvider,
   qx.ui.tree.provider.IVirtualTreeProvider
  ],

  include : [qx.ui.tree.core.MWidgetController],


  /**
   * @param tree {qx.ui.tree.VirtualTree} tree to provide.
   */
  construct : function(tree)
  {
    this.base(arguments);

    this._tree = tree;

    this.addListener("changeDelegate", this._onChangeDelegate, this);
    this._onChangeDelegate();
  },


  members :
  {
    /** @type {qx.ui.tree.VirtualTree} tree to provide. */
    _tree : null,


    /** @type {qx.ui.virtual.cell.WidgetCell} the used item renderer. */
    _renderer : null,


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */


    // interface implementation
    getCellWidget : function(row, column)
    {
      var item = this._tree.getLookupTable().getItem(row);

      var hasChildren = false;
      if (this._tree.isNode(item)) {
        hasChildren = this._tree.hasChildren(item);
      }

      var widget = this._renderer.getCellWidget();
      widget.setOpen(hasChildren && this._tree.isNodeOpen(item));
      widget.addListener("changeOpen", this.__onOpenChanged, this);
      widget.setUserData("cell.childProperty", this.getChildProperty());
      widget.setUserData("cell.showLeafs", this._tree.isShowLeafs());

      if(this._tree.getSelection().contains(item)) {
        this._styleSelectabled(widget);
      } else {
        this._styleUnselectabled(widget);
      }

      var level = this._tree.getLevel(row);
      if (!this._tree.isShowTopLevelOpenCloseIcons()) {
        level -= 1;
      }
      widget.setUserData("cell.level", level);

      if (!this._tree.isShowTopLevelOpenCloseIcons() && level == -1) {
        widget.setOpenSymbolMode("never");
      } else {
        widget.setOpenSymbolMode("auto");
      }

      this._bindItem(widget, row);
      qx.ui.core.queue.Widget.add(widget);

      return widget;
    },


    // interface implementation
    poolCellWidget : function(widget)
    {
      widget.removeListener("changeOpen", this.__onOpenChanged, this);
      this._removeBindingsFrom(widget);
      this._renderer.pool(widget);
      this._onPool(widget);
    },


    // Interface implementation
    createLayer : function() {
      return new qx.ui.virtual.layer.WidgetCell(this);
    },


    // Interface implementation
    createRenderer : function()
    {
      var createItem = qx.util.Delegate.getMethod(this.getDelegate(), "createItem");

      if (createItem == null) {
        createItem = function() {
          return new qx.ui.tree.VirtualTreeItem();
        }
      }

      var renderer = new qx.ui.virtual.cell.WidgetCell();
      renderer.setDelegate({
        createWidget : createItem
      });

      return renderer;
    },


    // interface implementation
    styleSelectabled : function(row)
    {
      var widget = this._tree._layer.getRenderedCellWidget(row, 0);
      this._styleSelectabled(widget);
    },


    // interface implementation
    styleUnselectabled : function(row)
    {
      var widget = this._tree._layer.getRenderedCellWidget(row, 0);
      this._styleUnselectabled(widget);
    },


    // interface implementation
    isSelectable : function(row)
    {
      var widget = this._tree._layer.getRenderedCellWidget(row, 0);
      if (widget != null) {
        return widget.isEnabled();
      } else {
        return true;
      }
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL API
    ---------------------------------------------------------------------------
    */


    /**
     * Styles a selected item.
     *
     * @param widget {qx.ui.core.Widget} widget to style.
     */
    _styleSelectabled : function(widget) {
      if(widget == null) {
        return;
      }

      this._renderer.updateStates(widget, {selected: 1});
    },


    /**
     * Styles a not selected item.
     *
     * @param widget {qx.ui.core.Widget} widget to style.
     */
    _styleUnselectabled : function(widget) {
      if(widget == null) {
        return;
      }

      this._renderer.updateStates(widget, {});
    },


    /**
     * Calls the delegate <code>onPool</code> method when it is used in the
     * {@link #delegate} property.
     *
     * @param item {qx.ui.core.Widget} Item to modify.
     */
    _onPool : function(item)
    {
      var onPool = qx.util.Delegate.getMethod(this.getDelegate(), "onPool");

      if (onPool != null) {
        onPool(item);
      }
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLERS
    ---------------------------------------------------------------------------
    */


    /**
     * Event handler for the created item's.
     *
     * @param event {qx.event.type.Data} fired event.
     */
    _onItemCreated : function(event)
    {
      var configureItem = qx.util.Delegate.getMethod(this.getDelegate(), "configureItem");

      if (configureItem != null) {
        var leaf = event.getData();
        configureItem(leaf);
      }
    },


    /**
     * Event handler for the change delegate event.
     *
     * @param event {qx.event.type.Data} fired event.
     */
    _onChangeDelegate : function(event)
    {
      if (this._renderer != null) {
        this._renderer.dispose();
        this.removeBindings();
      }

      this._renderer = this.createRenderer();
      this._renderer.addListener("created", this._onItemCreated, this);
    },


    /**
     * Handler when a node changes opened or closed state.
     *
     * @param event {qx.event.type.Data} The data event.
     */
    __onOpenChanged : function(event)
    {
      var widget = event.getTarget();

      var row = widget.getUserData("cell.row");
      var item = this._tree.getLookupTable().getItem(row);
      if (event.getData()) {
        this._tree.openNode(item);
      } else {
        this._tree.closeNode(item);
      }
    }
  },


  destruct : function()
  {
    this.removeBindings();
    this._renderer.dispose();
    this._tree = this._renderer = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * Abstract base class for layers of a virtual pane.
 *
 * This class queues calls to {@link #fullUpdate}, {@link #updateLayerWindow}
 * and {@link #updateLayerData} and only performs the absolute necessary
 * actions. Concrete implementation of this class must at least implement
 * the {@link #_fullUpdate} method. Additionally the two methods
 * {@link #_updateLayerWindow} and {@link #_updateLayerData} may be implemented
 * to increase the performance.
 */
qx.Class.define("qx.ui.virtual.layer.Abstract",
{
  extend : qx.ui.core.Widget,
  type : "abstract",

  implement : [qx.ui.virtual.core.ILayer],

  /*
   *****************************************************************************
      CONSTRUCTOR
   *****************************************************************************
   */

   construct : function()
   {
     this.base(arguments);

     this.__jobs = {};
   },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    anonymous :
    {
      refine: true,
      init: true
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __jobs : null,
    __arguments : null,

    __firstRow : null,
    __firstColumn : null,
    __rowSizes : null,
    __columnSizes : null,


    /**
     * Get the first rendered row
     *
     * @return {Integer} The first rendered row
     */
    getFirstRow : function() {
      return this.__firstRow;
    },


    /**
     * Get the first rendered column
     *
     * @return {Integer} The first rendered column
     */
    getFirstColumn : function() {
      return this.__firstColumn;
    },


    /**
     * Get the sizes of the rendered rows
     *
     * @return {Integer[]} List of row heights
     */
    getRowSizes : function() {
      return this.__rowSizes || [];
    },


    /**
     * Get the sizes of the rendered column
     *
     * @return {Integer[]} List of column widths
     */
    getColumnSizes : function() {
      return this.__columnSizes || [];
    },


    // overridden
    syncWidget : function(jobs)
    {
      // return if the layer is not yet rendered
      // it will rendered in the appear event
      if (!this.getContentElement().getDomElement()) {
        return;
      }

      if (
        this.__jobs.fullUpdate ||
        this.__jobs.updateLayerWindow && this.__jobs.updateLayerData
      )
      {
        this._fullUpdate.apply(this, this.__arguments);
      }
      else if (this.__jobs.updateLayerWindow)
      {
        this._updateLayerWindow.apply(this, this.__arguments);
      }
      else if (this.__jobs.updateLayerData  && this.__rowSizes)
      {
        this._updateLayerData();
      }

      if (this.__jobs.fullUpdate || this.__jobs.updateLayerWindow)
      {
        var args = this.__arguments;
        this.__firstRow = args[0];
        this.__firstColumn = args[1];
        this.__rowSizes = args[2];
        this.__columnSizes = args[3];
      }

      this.__jobs = {};
    },


    /**
     * Update the layer to reflect changes in the data the layer displays.
     *
     * Note: It is guaranteed that this method is only called after the layer
     * has been rendered.
     */
    _updateLayerData : function()
    {
      this._fullUpdate(
        this.__firstRow, this.__firstColumn,
        this.__rowSizes, this.__columnSizes
      );
    },


    /**
     * Do a complete update of the layer. All cached data should be discarded.
     * This method is called e.g. after changes to the grid geometry
     * (row/column sizes, row/column count, ...).
     *
     * Note: It is guaranteed that this method is only called after the layer
     * has been rendered.
     *
     * @param firstRow {Integer} Index of the first row to display
     * @param firstColumn {Integer} Index of the first column to display
     * @param rowSizes {Integer[]} Array of heights for each row to display
     * @param columnSizes {Integer[]} Array of widths for each column to display
     */
    _fullUpdate : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    ) {
      throw new Error("Abstract method '_fullUpdate' called!");
    },


    /**
     * Update the layer to display a different window of the virtual grid.
     * This method is called if the pane is scrolled, resized or cells
     * are prefetched. The implementation can assume that no other grid
     * data has been changed since the last "fullUpdate" of "updateLayerWindow"
     * call.
     *
     * Note: It is guaranteed that this method is only called after the layer
     * has been rendered.
     *
     * @param firstRow {Integer} Index of the first row to display
     * @param firstColumn {Integer} Index of the first column to display
     * @param rowSizes {Integer[]} Array of heights for each row to display
     * @param columnSizes {Integer[]} Array of widths for each column to display
     */
    _updateLayerWindow : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    )
    {
      this._fullUpdate(
        firstRow, firstColumn,
        rowSizes, columnSizes
      );
    },


    // interface implementation
    updateLayerData : function()
    {
      this.__jobs.updateLayerData = true;
      qx.ui.core.queue.Widget.add(this);
    },


    // interface implementation
    fullUpdate : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    )
    {
      this.__arguments = arguments;
      this.__jobs.fullUpdate = true;
      qx.ui.core.queue.Widget.add(this);
    },


    // interface implementation
    updateLayerWindow : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    ) {
      this.__arguments = arguments;
      this.__jobs.updateLayerWindow = true;
      qx.ui.core.queue.Widget.add(this);
    }
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__jobs = this.__arguments = this.__rowSizes = this.__columnSizes = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */


/**
 * EXPERIMENTAL!
 *
 * The WidgetCell layer renders each cell with a qooxdoo widget. The concrete
 * widget instance for each cell is provided by a cell provider.
 */
qx.Class.define("qx.ui.virtual.layer.WidgetCell",
{
  extend : qx.ui.virtual.layer.Abstract,

  include : [
    qx.ui.core.MChildrenHandling
  ],


  /**
   * @param widgetCellProvider {qx.ui.virtual.core.IWidgetCellProvider} This
   *    class manages the life cycle of the cell widgets.
   */
  construct : function(widgetCellProvider)
  {
    this.base(arguments);
    this.setZIndex(12);

    if (qx.core.Environment.get("qx.debug")) {
      this.assertInterface(
        widgetCellProvider,
        qx.ui.virtual.core.IWidgetCellProvider
      );
    }

    this._cellProvider = widgetCellProvider;
    this.__spacerPool = [];
  },


  /*
   *****************************************************************************
      PROPERTIES
   *****************************************************************************
   */

   properties :
   {
     // overridden
     anonymous :
     {
       refine: true,
       init: false
     }
   },

  events :
  {
    /**
     * Is fired when the {@link #_fullUpdate} or the
     * {@link #_updateLayerWindow} is finished.
     */
    updated : "qx.event.type.Event"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
     __spacerPool : null,

     /**
     * Returns the widget used to render the given cell. May return null if the
     * cell isn’t rendered currently rendered.
     *
     * @param row {Integer} The cell's row index
     * @param column {Integer} The cell's column index
     * @return {qx.ui.core.LayoutItem|null} the widget used to render the given
     *    cell or <code>null</code>
     */
     getRenderedCellWidget : function(row, column)
     {
       var columnCount = this.getColumnSizes().length;
       var rowCount = this.getRowSizes().length;

       var firstRow = this.getFirstRow();
       var firstColumn = this.getFirstColumn();

       if (
         row < firstRow ||
         row >= firstRow + rowCount ||
         column < firstColumn ||
         column >= firstColumn + columnCount
       ) {
         return null;
       }

       var childIndex = (column - firstColumn) + (row - firstRow) * columnCount;
       var widget = this._getChildren()[childIndex];

       if (widget.getUserData("cell.empty")) {
         return null;
       } else {
         return widget;
       }
     },


    /**
     * Get the spacer widget, for empty cells
     *
     * @return {qx.ui.core.Spacer} The spacer widget.
     */
    _getSpacer : function()
    {
      var spacer = this.__spacerPool.pop();
      if (!spacer)
      {
        spacer = new qx.ui.core.Spacer();
        spacer.setUserData("cell.empty", 1);
      }
      return spacer;
    },


    /**
     * Activates one of the still not empty items.
     * @param elementToPool {qx.ui.core.Widget} The widget which gets pooled.
     */
    _activateNotEmptyChild : function(elementToPool)
    {
      // get the current active element
      var active = qx.ui.core.FocusHandler.getInstance().getActiveWidget();
      // if the element to pool is active or one of its children
      if (active == elementToPool || qx.ui.core.Widget.contains(elementToPool, active)) {
        // search for a new child to activate
        var children = this._getChildren();
        for (var i = children.length - 1; i >= 0; i--) {
          if (!children[i].getUserData("cell.empty")) {
            children[i].activate();
            break;
          }
        };
      }
    },


    // overridden
    _fullUpdate : function(firstRow, firstColumn, rowSizes, columnSizes)
    {
      var cellProvider = this._cellProvider;

      var children = this._getChildren();
      for (var i=0; i<children.length; i++)
      {
        var child = children[i];
        if (child.getUserData("cell.empty")) {
          this.__spacerPool.push(child);
        } else {
          this._activateNotEmptyChild(child);
          cellProvider.poolCellWidget(child);
        }
      }

      this._removeAll();

      var top = 0;
      var left = 0;

      for (var y=0; y<rowSizes.length; y++)
      {
        for (var x=0; x<columnSizes.length; x++)
        {
          var row = firstRow + y;
          var column = firstColumn + x;

          var item = cellProvider.getCellWidget(row, column) || this._getSpacer();
          item.setUserBounds(left, top, columnSizes[x], rowSizes[y]);
          item.setUserData("cell.row", row);
          item.setUserData("cell.column", column);
          this._add(item);

          left += columnSizes[x];
        }
        top += rowSizes[y];
        left = 0;
      }

      this.fireEvent("updated");
    },


    _updateLayerWindow : function(
      firstRow, firstColumn,
      rowSizes, columnSizes
    )
    {
      // compute overlap of old and new window
      //
      //      +---+
      //      |  ##--+
      //      |  ##  |
      //      +--##  |
      //         +---+
      //


    if (qx.core.Environment.get("qx.debug"))
    {
      this.assertPositiveInteger(firstRow);
      this.assertPositiveInteger(firstColumn);
      this.assertArray(rowSizes);
      this.assertArray(columnSizes);
    }


      var lastRow = firstRow + rowSizes.length - 1;
      var lastColumn = firstColumn + columnSizes.length - 1;

      var overlap = {
        firstRow: Math.max(firstRow, this.getFirstRow()),
        lastRow: Math.min(lastRow, this._lastRow),
        firstColumn: Math.max(firstColumn, this.getFirstColumn()),
        lastColumn: Math.min(lastColumn, this._lastColumn)
      }

      this._lastColumn = lastColumn;
      this._lastRow = lastRow;

      if (
        overlap.firstRow > overlap.lastRow ||
        overlap.firstColumn > overlap.lastColumn
      ) {
        return this._fullUpdate(
          firstRow, firstColumn,
          rowSizes, columnSizes
        );
      }

      // collect the widgets to move
      var children = this._getChildren();
      var lineLength = this.getColumnSizes().length;
      var widgetsToMove = [];
      var widgetsToMoveIndexes = {};
      for (var row=firstRow; row<=lastRow; row++)
      {
        widgetsToMove[row] = [];
        for (var column=firstColumn; column<=lastColumn; column++)
        {
          if (
            row >= overlap.firstRow &&
            row <= overlap.lastRow &&
            column >= overlap.firstColumn &&
            column <= overlap.lastColumn
          )
          {
            var x = column - this.getFirstColumn();
            var y = row - this.getFirstRow();
            var index = y*lineLength + x;
            widgetsToMove[row][column] = children[index];
            widgetsToMoveIndexes[index] = true;
          }
        }
      }

      var cellProvider = this._cellProvider;

      // pool widgets
      var children = this._getChildren();
      for (var i=0; i<children.length; i++)
      {
        if (!widgetsToMoveIndexes[i])
        {
          var child = children[i];
          if (child.getUserData("cell.empty")) {
            this.__spacerPool.push(child);
          } else {
            this._activateNotEmptyChild(child);
            cellProvider.poolCellWidget(child);
          }
        }
      }

      this._removeAll();

      var top = 0;
      var left = 0;

      for (var y=0; y<rowSizes.length; y++)
      {
        for (var x=0; x<columnSizes.length; x++)
        {
          var row = firstRow + y;
          var column = firstColumn + x;

          var item =
            widgetsToMove[row][column] ||
            cellProvider.getCellWidget(row, column) ||
            this._getSpacer();

          item.setUserBounds(left, top, columnSizes[x], rowSizes[y]);
          item.setUserData("cell.row", row);
          item.setUserData("cell.column", column);
          this._add(item);

          left += columnSizes[x];
        }
        top += rowSizes[y];
        left = 0;
      }

      this.fireEvent("updated");
    }
  },

  destruct : function()
  {
    var children = this._getChildren();
    for (var i=0; i<children.length; i++) {
      children[i].dispose();
    }

    this._cellProvider = this.__spacerPool = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A Spacer is a "virtual" widget, which can be placed into any layout and takes
 * the space a normal widget of the same size would take.
 *
 * Spacers are invisible and very light weight because they don't require any
 * DOM modifications.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var container = new qx.ui.container.Composite(new qx.ui.layout.HBox());
 *   container.add(new qx.ui.core.Widget());
 *   container.add(new qx.ui.core.Spacer(50));
 *   container.add(new qx.ui.core.Widget());
 * </pre>
 *
 * This example places two widgets and a spacer into a container with a
 * horizontal box layout. In this scenario the spacer creates an empty area of
 * 50 pixel width between the two widgets.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/spacer.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.core.Spacer",
{
  extend : qx.ui.core.LayoutItem,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

 /**
  * @param width {Integer?null} the initial width
  * @param height {Integer?null} the initial height
  */
  construct : function(width, height)
  {
    this.base(arguments);

    // Initialize dimensions
    this.setWidth(width != null ? width : 0);
    this.setHeight(height != null ? height : 0);
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Helper method called from the visibility queue to detect outstanding changes
     * to the appearance.
     *
     * @internal
     */
    checkAppearanceNeeds : function() {
      // placeholder to improve compatibility with Widget.
    },


    /**
     * Recursively adds all children to the given queue
     *
     * @param queue {Map} The queue to add widgets to
     */
    addChildrenToQueue : function(queue) {
      // placeholder to improve compatibility with Widget.
    },


    /**
     * Removes this widget from its parent and dispose it.
     *
     * Please note that the widget is not disposed synchronously. The
     * real dispose happens after the next queue flush.
     *
     */
    destroy : function()
    {
      if (this.$$disposed) {
        return;
      }

      var parent = this.$$parent;
      if (parent) {
        parent._remove(this);
      }

      qx.ui.core.queue.Dispose.add(this);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * A widget cell renderer manages a pool of widgets to render cells in a
 * {@link qx.ui.virtual.layer.WidgetCell} layer.
 */
qx.Interface.define("qx.ui.virtual.cell.IWidgetCell",
{
  members :
  {
    /**
     * Get a widget instance to render the cell
     *
     * @param data {var} Data needed for the cell to render.
     * @param states {Map} The states set on the cell (e.g. <i>selected</i>,
     * <i>focused</i>, <i>editable</i>).
     *
     * @return {qx.ui.core.LayoutItem} The cell widget
     */
    getCellWidget : function(data, states) {},


    /**
     * Release the given widget instance.
     *
     * Either pool or dispose the widget.
     *
     * @param widget {qx.ui.core.LayoutItem} The cell widget to pool
     */
    pool : function(widget) {},


    /**
     * Update the states of the given widget.
     *
     * @param widget {qx.ui.core.LayoutItem} The cell widget to update
     * @param states {Map} The cell widget's states
     */
    updateStates : function(widget, states) {},


    /**
     * Update the data the cell widget should display
     *
     * @param widget {qx.ui.core.LayoutItem} The cell widget to update
     * @param data {var} The data to display
     */
    updateData : function(widget, data) {}
  }
});
/**
 * Abstract base class for widget based cell renderer.
 */
qx.Class.define("qx.ui.virtual.cell.AbstractWidget",
{
  extend : qx.core.Object,
  implement : [qx.ui.virtual.cell.IWidgetCell],


  construct : function()
  {
    this.base(arguments);

    this.__pool = [];
  },


  events :
  {
    /** Fired when a new <code>LayoutItem</code> is created. */
    "created" : "qx.event.type.Data"
  },


  members :
  {
    __pool : null,


    /**
     * Creates the widget instance.
     *
     * @abstract
     * @return {qx.ui.core.LayoutItem} The widget used to render a cell
     */
    _createWidget : function() {
      throw new Error("abstract method call");
    },


    // interface implementation
    updateData : function(widget, data) {
      throw new Error("abstract method call");
    },


    // interface implementation
    updateStates : function(widget, states)
    {
      var oldStates = widget.getUserData("cell.states");

      // remove old states
      if (oldStates)
      {
        var newStates = states || {};
        for (var state in oldStates)
        {
          if (!newStates[state]) {
            widget.removeState(state);
          }
        }
      }
      else
      {
        oldStates = {};
      }

      // apply new states
      if (states)
      {
        for (var state in states)
        {
          if (!oldStates.state) {
            widget.addState(state);
          }
        }
      }

      widget.setUserData("cell.states", states);
    },


    // interface implementation
    getCellWidget : function(data, states)
    {
      var widget = this.__getWidgetFromPool();
      this.updateStates(widget, states);
      this.updateData(widget, data);
      return widget;
    },


    // interface implementation
    pool : function(widget) {
      this.__pool.push(widget);
    },

    /**
     * Cleanup all <code>LayoutItem</code> and destroy them.
     */
    _cleanupPool : function() {
      var widget = this.__pool.pop();

      while(widget)
      {
        widget.destroy();
        widget = this.__pool.pop();
      }
    },

    /**
     * Returns a <code>LayoutItem</code> from the pool, when the pool is empty
     * a new <code>LayoutItem</code> is created.
     *
     * @return {qx.ui.core.LayoutItem} The cell widget
     */
    __getWidgetFromPool : function()
    {
      var widget = this.__pool.shift();

      if (widget == null)
      {
        widget = this._createWidget();
        this.fireDataEvent("created", widget);
      }

      return widget;
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function()
  {
    this._cleanupPool();
    this.__pool = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * EXPERIMENTAL!
 *
 * Cell renderer can be used for Widget rendering. The Widget creation can be configured with the
 * {@link #delegate} property:
 *
 * <pre class="javascript">
 * widgetCell.setDelegate(
 * {
 *   createWidget : function() {
 *     return new qx.ui.form.ListItem();
 *   }
 * });
 * </pre>
 *
 * When the {@link #delegate} property is not used {@link qx.ui.core.Widget} instances are created as
 * fallback.
 *
 * The {@link #updateData} method can be used to update any Widget property. Just use a <code>Map</code>
 * with property name as key:
 *
 * <pre class="javascript">
 * // widget is a qx.ui.form.ListItem instance
 * widgetCell.updateData(widget,
 * {
 *   label: "my label value",
 *   icon: "qx/icon/22/emotes/face-angel.png"
 * });
 * </pre>
 */
qx.Class.define("qx.ui.virtual.cell.WidgetCell",
{
  extend : qx.ui.virtual.cell.AbstractWidget,

  properties :
  {
    /**
     * Delegation object, which can have one or more functions defined by the
     * {@link qx.ui.virtual.cell.IWidgetCellDelegate} interface.
     */
    delegate :
    {
      apply: "_applyDelegate",
      init: null,
      nullable: true
    }
  },

  members :
  {
    // apply method
    _applyDelegate : function(value, old) {
      this._cleanupPool();
    },

    // overridden
    _createWidget : function() {
      var delegate = this.getDelegate();

      if (delegate != null && delegate.createWidget != null) {
        return delegate.createWidget();
      } else {
        return new qx.ui.core.Widget();
      }
    },

    // overridden
    updateData : function(widget, data) {
      for (var key in data)
      {
        if (qx.Class.hasProperty(widget.constructor, key)) {
          qx.util.PropertyUtil.setUserValue(widget, key, data[key]);
        } else {
          throw new Error("Can't update data! The key '" + key + "' is not a Property!")
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Can be included for implementing {@link qx.ui.form.IModel}. It only contains
 * a nullable property named 'model' with a 'changeModel' event.
 */
qx.Mixin.define("qx.ui.form.MModelProperty",
{
  properties :
  {
    /**
     * Model property for storing additional information for the including
     * object. It can act as value property on form items for example.
     *
     * Be careful using that property as this is used for the
     * {@link qx.ui.form.MModelSelection} it has some restrictions:
     *
     * * Don't use equal models in one widget using the
     *     {@link qx.ui.form.MModelSelection}.
     *
     * * Avoid setting only some model properties if the widgets are added to
     *     a {@link qx.ui.form.MModelSelection} widge.
     *
     * Both restrictions result of the fact, that the set models are deputies
     * for their widget.
     */
    model :
    {
      nullable : true,
      event : "changeModel",
      apply : "_applyModel",
      dereference : true
    }
  },


  members :
  {
    // apply method
    _applyModel : function(value, old) {
      // Empty implementation
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Each object which wants to store data representative for the real item
 * should implement this interface.
 */
qx.Interface.define("qx.ui.form.IModel",
{

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the model data changes */
    "changeModel" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Set the representative data for the item.
     *
     * @param value {var} The data.
     */
    setModel : function(value) {},


    /**
     * Returns the representative data for the item
     *
     * @return {var} The data.
     */
    getModel : function() {},


    /**
     * Sets the representative data to null.
     */
    resetModel : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Derrell Lipman (derrell)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * The AbstractItem serves as a common superclass for the {@link
 * qx.ui.tree.core.AbstractTreeItem} and {@link qx.ui.tree.VirtualTreeItem} classes.
 *
 * @childControl label {qx.ui.basic.Label} label of the tree item
 * @childControl icon {qx.ui.basic.Image} icon of the tree item
 * @childControl open {qx.ui.tree.core.FolderOpenButton} button to open/close a subtree
 */
qx.Class.define("qx.ui.tree.core.AbstractItem",
{
  extend : qx.ui.core.Widget,
  type : "abstract",
  include : [qx.ui.form.MModelProperty],
  implement : [qx.ui.form.IModel],


  /**
   * @param label {String?null} The tree item's caption text
   */
  construct : function(label)
  {
    this.base(arguments);

    if (label != null) {
      this.setLabel(label);
    }

    this._setLayout(new qx.ui.layout.HBox());
    this._addWidgets();

    this.initOpen();
  },


  properties :
  {
    /**
     * Whether the tree item is opened.
     */
    open :
    {
      check : "Boolean",
      init : false,
      event : "changeOpen",
      apply : "_applyOpen"
    },


    /**
     * Controls, when to show the open symbol. If the mode is "auto" , the open
     * symbol is shown only if the item has child items.
     */
    openSymbolMode :
    {
      check : ["always", "never", "auto"],
      init : "auto",
      event : "changeOpenSymbolMode",
      apply : "_applyOpenSymbolMode"
    },


    /**
     * The number of pixel to indent the tree item for each level.
     */
    indent :
    {
      check : "Integer",
      init : 19,
      apply : "_applyIndent",
      event : "changeIndent",
      themeable : true
    },


    /**
     * URI of "closed" icon. Can be any URI String supported by qx.ui.basic.Image.
     **/
    icon :
    {
      check : "String",
      apply : "_applyIcon",
      event : "changeIcon",
      nullable : true,
      themeable : true
    },


    /**
     * URI of "opened" icon. Can be any URI String supported by qx.ui.basic.Image.
     **/
    iconOpened :
    {
      check : "String",
      apply : "_applyIconOpened",
      event : "changeIconOpened",
      nullable : true,
      themeable : true
    },


    /**
     * The label/caption/text
     */
    label :
    {
      check : "String",
      apply : "_applyLabel",
      event : "changeLabel",
      init : ""
    }
  },


  members :
  {
    __labelAdded : null,
    __iconAdded : null,
    __spacer : null,


    /**
     * This method configures the tree item by adding its sub widgets like
     * label, icon, open symbol, ...
     *
     * This method must be overridden by sub classes.
     */
    _addWidgets : function() {
      throw new Error("Abstract method call.");
    },


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "label":
          control = new qx.ui.basic.Label().set({
            alignY: "middle",
            anonymous: true,
            value: this.getLabel()
          });
          break;

        case "icon":
          control = new qx.ui.basic.Image().set({
            alignY: "middle",
            anonymous: true,
            source: this.getIcon()
          });
          break;

        case "open":
          control = new qx.ui.tree.core.FolderOpenButton().set({
            alignY: "middle"
          });
          control.addListener("changeOpen", this._onChangeOpen, this);
          control.addListener("resize", this._updateIndent, this);
          break;
      }

      return control || this.base(arguments, id);
    },


    /*
    ---------------------------------------------------------------------------
      TREE ITEM CONFIGURATION
    ---------------------------------------------------------------------------
    */

    /**
     * Adds a sub widget to the tree item's horizontal box layout.
     *
     * @param widget {qx.ui.core.Widget} The widget to add
     * @param options {Map?null} The (optional) layout options to use for the widget
     */
    addWidget : function(widget, options) {
      this._add(widget, options);
    },


    /**
     * Adds the spacer used to render the indentation to the item's horizontal
     * box layout. If the spacer has been added before, it is removed from its
     * old position and added to the end of the layout.
     */
    addSpacer : function()
    {
      if (!this.__spacer) {
        this.__spacer = new qx.ui.core.Spacer();
      } else {
        this._remove(this.__spacer);
      }

      this._add(this.__spacer);
    },


    /**
     * Adds the open button to the item's horizontal box layout. If the open
     * button has been added before, it is removed from its old position and
     * added to the end of the layout.
     */
    addOpenButton : function() {
      this._add(this.getChildControl("open"));
    },


    /**
     * Event handler, which listens to open state changes of the open button
     *
     * @param e {qx.event.type.Data} The event object
     */
    _onChangeOpen : function(e)
    {
      if (this.isOpenable()) {
        this.setOpen(e.getData());
      }
    },


    /**
     * Adds the icon widget to the item's horizontal box layout. If the icon
     * widget has been added before, it is removed from its old position and
     * added to the end of the layout.
     */
    addIcon : function()
    {
      var icon = this.getChildControl("icon");

      if (this.__iconAdded) {
        this._remove(icon);
      }

      this._add(icon);
      this.__iconAdded = true;
    },


    /**
     * Adds the label to the item's horizontal box layout. If the label
     * has been added before, it is removed from its old position and
     * added to the end of the layout.
     *
     * @param text {String?0} The label's contents
     */
    addLabel : function(text)
    {
      var label = this.getChildControl("label");

      if (this.__labelAdded) {
        this._remove(label);
      }

      if (text) {
        this.setLabel(text);
      } else {
        label.setValue(this.getLabel());
      }

      this._add(label);
      this.__labelAdded = true;
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyIcon : function(value, old)
    {
      // Set "closed" icon - even when "opened" - if no "opened" icon was
      // user-defined
      if (!this.__getUserValueIconOpened()) {
        this.__setIconSource(value);
      }

      else if (!this.isOpen()) {
        this.__setIconSource(value);
      }

    },


    // property apply
    _applyIconOpened : function(value, old)
    {

      if (this.isOpen()) {

        // ... both "closed" and "opened" icon were user-defined
        if (this.__getUserValueIcon() && this.__getUserValueIconOpened()) {
          this.__setIconSource(value);
        }

        // .. only "opened" icon was user-defined
        else if (!this.__getUserValueIcon() && this.__getUserValueIconOpened()) {
          this.__setIconSource(value);
        }
      }

    },


    // property apply
    _applyLabel : function(value, old)
    {
      var label = this.getChildControl("label", true);
      if (label) {
        label.setValue(value);
      }
    },

    // property apply
    _applyOpen : function(value, old)
    {
      var open = this.getChildControl("open", true);
      if (open) {
        open.setOpen(value);
      }

      //
      // Determine source of icon for "opened" or "closed" state
      //
      var source;

      // Opened
      if (value) {
        // Never overwrite user-defined icon with themed "opened" icon
        source = this.__getUserValueIconOpened() ? this.getIconOpened() : null;
      }

      // Closed
      else {
        source = this.getIcon();
      }

      if (source) {
        this.__setIconSource(source);
      }

      value ? this.addState("opened") : this.removeState("opened");

    },

    /**
    * Get user-defined value of "icon" property
    *
    * @return {var} The user value of the property "icon"
    */
    __getUserValueIcon : function() {
      return qx.util.PropertyUtil.getUserValue(this, "icon");
    },

    /**
    * Get user-defined value of "iconOpened" property
    *
    * @return {var} The user value of the property "iconOpened"
    */
    __getUserValueIconOpened : function() {
      return qx.util.PropertyUtil.getUserValue(this, "iconOpened");
    },

    /**
    * Set source of icon child control
    *
    * @param url {String} The URL of the icon
    */
    __setIconSource : function(url) {
      var icon = this.getChildControl("icon", true);
      if (icon) {
        icon.setSource(url);
      }
    },


    /*
    ---------------------------------------------------------------------------
      INDENT HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Whether the tree item can be opened.
     *
     * @return {Boolean} Whether the tree item can be opened.
     */
    isOpenable : function()
    {
      var openMode = this.getOpenSymbolMode();
      return (
        openMode === "always" ||
        openMode === "auto" && this.hasChildren()
      );
    },


    /**
     * Whether the open symbol should be shown
     *
     * @return {Boolean} Whether the open symbol should be shown.
     */
    _shouldShowOpenSymbol : function() {
      throw new Error("Abstract method call.");
    },


    // property apply
    _applyOpenSymbolMode : function(value, old) {
      this._updateIndent();
    },


    /**
     * Update the indentation of the tree item.
     */
    _updateIndent : function()
    {
      var openWidth = 0;
      var open = this.getChildControl("open", true);

      if (open)
      {
        if (this._shouldShowOpenSymbol())
        {
          open.show();

          var openBounds = open.getBounds();
          if (openBounds) {
            openWidth = openBounds.width;
          } else {
            return;
          }
        }
        else
        {
          open.exclude();
        }
      }

      if (this.__spacer) {
        this.__spacer.setWidth((this.getLevel() + 1) * this.getIndent() - openWidth);
      }
    },


    // property apply
    _applyIndent : function(value, old) {
      this._updateIndent();
    },


    /**
     * Computes the item's nesting level. If the item is not part of a tree
     * this function will return <code>null</code>.
     *
     * @return {Integer|null} The item's nesting level or <code>null</code>.
     */
    getLevel : function() {
      throw new Error("Abstract method call.");
    },


    // overridden
    syncWidget : function(jobs) {
      this._updateIndent();
    },


    /**
     * Whether the item has any children
     *
     * @return {Boolean} Whether the item has any children.
     */
    hasChildren : function() {
      throw new Error("Abstract method call.");
    }
  },


  destruct : function() {
    this._disposeObjects("__spacer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The small folder open/close button
 */
qx.Class.define("qx.ui.tree.core.FolderOpenButton",
{
  extend : qx.ui.basic.Image,
  include : qx.ui.core.MExecutable,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    this.initOpen();

    this.addListener("tap", this._onTap);
    this.addListener("pointerdown", this._stopPropagation, this);
    this.addListener("pointerup", this._stopPropagation, this);
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Whether the button state is "open"
     */
    open :
    {
      check : "Boolean",
      init : false,
      event : "changeOpen",
      apply : "_applyOpen"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // property apply
    _applyOpen : function(value, old)
    {
      value ? this.addState("opened") : this.removeState("opened");
      this.execute();
    },


    /**
     * Stop tap event propagation
     *
     * @param e {qx.event.type.Event} The event object
     */
    _stopPropagation : function(e) {
      e.stopPropagation();
    },


    /**
     * Pointer tap event listener
     *
     * @param e {qx.event.type.Pointer} Pointer event
     */
    _onTap : function(e)
    {
      this.toggleOpen();
      e.stopPropagation();
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * The tree item is a tree element for the {@link VirtualTree}, which can have
 * nested tree elements.
 */
qx.Class.define("qx.ui.tree.VirtualTreeItem",
{
  extend : qx.ui.tree.core.AbstractItem,


  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "virtual-tree-folder"
    }
  },


  members :
  {
    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates : {
      selected : true
    },


    // overridden
    _addWidgets : function()
    {
      this.addSpacer();
      this.addOpenButton();
      this.addIcon();
      this.addLabel();
    },


    // overridden
    _shouldShowOpenSymbol : function()
    {
      var open = this.getChildControl("open", true);
      if (open == null) {
        return false;
      }

      return this.isOpenable();
    },


    // overridden
    getLevel : function() {
      return this.getUserData("cell.level");
    },


    // overridden
    hasChildren : function()
    {
      var model = this.getModel();
      var childProperty = this.getUserData("cell.childProperty");
      var showLeafs = this.getUserData("cell.showLeafs");

      return qx.ui.tree.core.Util.hasChildren(model, childProperty, !showLeafs);
    },


    // apply method
    _applyModel : function(value, old)
    {
      var childProperty = this.getUserData("cell.childProperty");
      var showLeafs = this.getUserData("cell.showLeafs");

      if (value != null && qx.ui.tree.core.Util.isNode(value, childProperty))
      {
        var eventType = "change" + qx.lang.String.firstUp(childProperty);
        // listen to children property changes
        if (qx.Class.hasProperty(value.constructor, childProperty)) {
          value.addListener(eventType, this._onChangeChildProperty, this);
        }


        // children property has been set already, immediately add
        // listener for indent updating
        if (qx.ui.tree.core.Util.hasChildren(value, childProperty, !showLeafs)) {
          value.get(childProperty).addListener("changeLength",
            this._onChangeLength, this);
          this._updateIndent();
        }
      }


      if (old != null && qx.ui.tree.core.Util.isNode(old, childProperty))
      {
        var eventType = "change" + qx.lang.String.firstUp(childProperty);
        old.removeListener(eventType, this._onChangeChildProperty, this);

        var oldChildren = old.get(childProperty);
        if (oldChildren) {
          oldChildren.removeListener("changeLength", this._onChangeLength, this);
        }
      }
    },


    /**
     * Handler to update open/close icon when model length changed.
     */
    _onChangeLength : function() {
      this._updateIndent();
    },


    /**
     * Handler to add listener to array of children property.
     *
     * @param e {qx.event.type.Data} Data event; provides children array
     */
    _onChangeChildProperty : function(e)
    {
      var children = e.getData();
      var old = e.getOldData();

      if (children) {
        this._updateIndent();
        children.addListener("changeLength", this._onChangeLength, this);
      }

      if (old) {
        old.removeListener("changeLength", this._onChangeLength, this);
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This utility class implements some methods for the <code>VirtualTree</code>.
 */
qx.Class.define("qx.ui.tree.core.Util",
{
  statics :
  {
    /**
     * Returns if the passed item is a node or a leaf.
     *
     * @param node {qx.core.Object} Node to check.
     * @param childProperty {String} The property name to find the children.
     * @return {Boolean} <code>True</code> when the passed item is a node,
     *   </code>false</code> when it is a leaf.
     */
    isNode : function(node, childProperty)
    {
      if (node == null || childProperty == null) {
        return false;
      }
      return qx.Class.hasProperty(node.constructor, childProperty);
    },


    /**
     * Returns whether the node has visible children or not.
     *
     * @param node {qx.core.Object} Node to check.
     * @param childProperty {String} The property name to find the children.
     * @param ignoreLeafs {Boolean?} Indicates whether leafs are ignored. This means when it is set to
     *    <code>true</code> a node which contains only leafs has no children. The default value is <code>false</code>.
     * @return {Boolean} <code>True</code> when the node has visible children,
     *   <code>false</code> otherwise.
     */
    hasChildren : function(node, childProperty, ignoreLeafs)
    {
      if (node == null || childProperty == null || !this.isNode(node, childProperty)) {
        return false;
      }

      var children = node.get(childProperty);
      if (children == null) {
        return false;
      }

      if (!ignoreLeafs) {
        return children.length > 0;
      }
      else
      {
        for (var i = 0; i < children.getLength(); i++)
        {
          var child = children.getItem(i);
          if (this.isNode(child, childProperty)) {
            return true;
          }
        }
      }
      return false;
    }
  }
});
