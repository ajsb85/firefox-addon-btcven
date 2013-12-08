/* ***** BEGIN LICENSE BLOCK *****
 *	BTCVEN Add-on for Mozilla Products.
 *	Copyright (C) 2013  Bitcoin Venezuela
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License, or
 *	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	Original Author: Alexander Salas <alexandersalas@bitcoinvenezuela.com>
 *
 *	Developers: 
 *		Alexander Salas <alexandersalas@bitcoinvenezuela.com>
 *	Contributors:   
 *		Randy Brito 
 *		Jesús Zuleta
 *		Joan Telo
 *		Jorge Bonilla
 *		Daniel Arraez
 *	Translators:    
 *		Fatma Youssef <fatma.youssef@globaltranslator.info>
 *
 * ***** END LICENSE BLOCK ***** */

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const keysetID = "btcven-keyset";
const keyID = "RR:btcven";
const fileMenuitemID = "menu_FilebtcvenItem";
var XUL_APP = {name: Services.appinfo.name};

switch(Services.appinfo.name) {
case "Thunderbird":
  XUL_APP.winType = "mail:3pane";
  XUL_APP.baseKeyset = "mailKeys";
  break;
case "Fennec": break;
default: //"Firefox", "SeaMonkey"
  XUL_APP.winType = "navigator:browser";
  XUL_APP.baseKeyset = "mainKeyset";
}

const PREF_BRANCH = "extensions.btcven.";
const PREFS = {
  modifiers: "accel,alt",
  locale: Cc["@mozilla.org/chrome/chrome-registry;1"]
      .getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global"),
  toolbar: "",
  "toolbar.before": "",
  get key() _("btcven.ak", getPref("locale"))
};

var prefChgHandlers = [];
let PREF_OBSERVER = {
  observe: function(aSubject, aTopic, aData) {
    if ("nsPref:changed" != aTopic || !(aData in PREFS)) return;
    prefChgHandlers.forEach(function(func) func && func(aData));
  }
}

let logo = "";


/* Includes a javascript file with loadSubScript
*
* @param src (String)
* The url of a javascript file to include.
*/
(function(global) global.include = function include(src) {
  var o = {};
  Components.utils.import("resource://gre/modules/Services.jsm", o);
  var uri = o.Services.io.newURI(
      src, null, o.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null));
  o.Services.scriptloader.loadSubScript(uri.spec, global);
})(this);

/* Imports a commonjs style javascript file with loadSubScrpt
 * 
 * @param src (String)
 * The url of a javascript file.
 */
(function(global) {
  var modules = {};
  global.require = function require(src) {
    if (modules[src]) return modules[src];
    var scope = {require: global.require, exports: {}};
    var tools = {};
    Components.utils.import("resource://gre/modules/Services.jsm", tools);
    var baseURI = tools.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null);
    try {
      var uri = tools.Services.io.newURI(
          "packages/" + src + ".js", null, baseURI);
      tools.Services.scriptloader.loadSubScript(uri.spec, scope);
    } catch (e) {
      var uri = tools.Services.io.newURI(src, null, baseURI);
      tools.Services.scriptloader.loadSubScript(uri.spec, scope);
    }
    return modules[src] = scope.exports;
  }
})(this);


var {unload} = require("unload");
var {runOnLoad, runOnWindows, watchWindows} = require("window-utils");
include("includes/l10n.js");
include("includes/prefs.js");


function setPref(aKey, aVal) {
  aVal = ("wrapper-btcven-toolbarbutton" == aVal) ? "" : aVal;
  switch (typeof(aVal)) {
    case "string":
      var ss = Cc["@mozilla.org/supports-string;1"]
          .createInstance(Ci.nsISupportsString);
      ss.data = aVal;
      Services.prefs.getBranch(PREF_BRANCH)
          .setComplexValue(aKey, Ci.nsISupportsString, ss);
      break;
  }
}

function addMenuItem(win) {
  var $ = function(id) win.document.getElementById(id);

  function removeMI() {
    var menuitem = $(fileMenuitemID);
    menuitem && menuitem.parentNode.removeChild(menuitem);
  }
  removeMI();

  // add the new menuitem to File menu
  let (btcvenMI = win.document.createElementNS(NS_XUL, "menuitem")) {
    btcvenMI.setAttribute("id", fileMenuitemID);
    btcvenMI.setAttribute("class", "menuitem-iconic");
    btcvenMI.setAttribute("label", _("btcven", getPref("locale")));
    btcvenMI.setAttribute("accesskey", "B");
    btcvenMI.setAttribute("key", keyID);
    btcvenMI.style.listStyleImage = "url('" + logo + "')";
    btcvenMI.addEventListener("command", btcven, true);

    $("menu_FilePopup").insertBefore(btcvenMI, $("menu_FileQuitItem"));
  }

  unload(removeMI, win);
}

function btcven() {
  //ToDO

  return true;
}

function main(win) {
  let doc = win.document;
  function $(id) doc.getElementById(id);
  function xul(type) doc.createElementNS(NS_XUL, type);

  let btcvenKeyset = xul("keyset");
  btcvenKeyset.setAttribute("id", keysetID);

  // add hotkey
  let (btcvenKey = xul("key")) {
    btcvenKey.setAttribute("id", keyID);
    btcvenKey.setAttribute("key", getPref("key"));
    btcvenKey.setAttribute("modifiers", getPref("modifiers"));
    btcvenKey.setAttribute("oncommand", "void(0);");
    btcvenKey.addEventListener("command", btcven, true);
    $(XUL_APP.baseKeyset).parentNode.appendChild(btcvenKeyset).appendChild(btcvenKey);
  }

  // add menu bar item to File menu
  addMenuItem(win);

  // add app menu item to Firefox button for Windows 7
  let appMenu = $("appmenuPrimaryPane"), btcvenAMI;
  if (appMenu) {
    btcvenAMI = $(fileMenuitemID).cloneNode(false);
    btcvenAMI.setAttribute("id", "appmenu_btcvenItem");
    btcvenAMI.setAttribute("class", "menuitem-iconic menuitem-iconic-tooltip");
    btcvenAMI.style.listStyleImage = "url('" + logo + "')";
    btcvenAMI.addEventListener("command", btcven, true);
    appMenu.insertBefore(btcvenAMI, $("appmenu-quit"));
  }

  // add toolbar button
  let btcvenTBB = xul("toolbarbutton");
  btcvenTBB.setAttribute("id", "btcven-toolbarbutton");
  btcvenTBB.setAttribute("type", "button");
  btcvenTBB.setAttribute("image", addon.getResourceURI("icon16.svg").spec);
  btcvenTBB.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
  btcvenTBB.setAttribute("label", _("btcven", getPref("locale")));
  btcvenTBB.addEventListener("command", btcven, true);
  let tbID = getPref("toolbar");
  ($("navigator-toolbox") || $("mail-toolbox")).palette.appendChild(btcvenTBB);
  if (tbID) {
    var tb = $(tbID);
    if (tb) {
      let b4ID = getPref("toolbar.before");
      let b4 = $(b4ID);
      if (!b4) { // fallback for issue 34
        let currentset = tb.getAttribute("currentset").split(",");
        let i = currentset.indexOf("btcven-toolbarbutton") + 1;
        if (i > 0) {
          let len = currentset.length;
          for (; i < len; i++) {
            b4 = $(currentset[i]);
            if (b4) break;
          }
        }
      }
      tb.insertItem("btcven-toolbarbutton", b4, null, false);
    }
  }

  function saveTBNodeInfo(aEvt) {
    setPref("toolbar", btcvenTBB.parentNode.getAttribute("id") || "");
    setPref("toolbar.before", (btcvenTBB.nextSibling || "")
        && btcvenTBB.nextSibling.getAttribute("id").replace(/^wrapper-/i, ""));
  }
  win.addEventListener("aftercustomization", saveTBNodeInfo, false);

  var prefChgHandlerIndex = prefChgHandlers.push(function(aData) {
    switch (aData) {
      case "locale":
        let label = _("btcven", getPref("locale"));
        $(keyID).setAttribute("label", label);
        btcvenTBB.setAttribute("label", label);
        break;
      case "key":
      case "modifiers":
        $(keyID).setAttribute(aData, getPref(aData));
        break;
    }
    addMenuItem(win);
  }) - 1;

  unload(function() {
    btcvenKeyset.parentNode.removeChild(btcvenKeyset);
    appMenu && appMenu.removeChild(btcvenAMI);
    btcvenTBB.parentNode.removeChild(btcvenTBB);
    win.removeEventListener("aftercustomization", saveTBNodeInfo);
    prefChgHandlers[prefChgHandlerIndex] = null;
  }, win);
}

var addon = {
  getResourceURI: function(filePath) ({
    spec: __SCRIPT_URI_SPEC__ + "/../" + filePath
  })
}

function disable(id) {
  Cu.import("resource://gre/modules/AddonManager.jsm");
  AddonManager.getAddonByID(id, function(addon) {
    addon.userDisabled = true;
  });
}

function install(data) {
  if ("Fennec" == XUL_APP.name) disable(data.id);
}
function uninstall(){}
function startup(data, reason) {
  if ("Fennec" == XUL_APP.name) {
    if (ADDON_ENABLE == reason) btcven();
    disable(data.id);
  }

  var prefs = Services.prefs.getBranch(PREF_BRANCH);

  // setup l10n
  l10n(addon, "btcven.properties");
  unload(l10n.unload);

  // setup prefs
  setDefaultPrefs();

  logo = addon.getResourceURI("icon16.svg").spec;
  watchWindows(main, XUL_APP.winType);
  prefs = prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.addObserver("", PREF_OBSERVER, false);
  unload(function() prefs.removeObserver("", PREF_OBSERVER));
};
function shutdown(data, reason) unload()
