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
  toolbar: "nav-bar-customization-target",
  "toolbar.before": "search-container",
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
	function btcven() {
		win.gBrowser.selectedTab = win.gBrowser.addTab("http://www.bitcoinvenezuela.com/");
	}

  unload(removeMI, win);
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
  
  	function btcven() {
		win.gBrowser.selectedTab = win.gBrowser.addTab("http://www.bitcoinvenezuela.com/");
	}
	var style1 = 'color: #E07C00;font-size: 100%;vertical-align: baseline;text-align: right;font-family: "HelveticaNeue-Light","Helvetica Neue Light","Helvetica Neue",Helvetica;letter-spacing: 1pt;';
	var style2 = 'font-size: 0.625rem;vertical-align: baseline;';
	var style3 = 'margin: 3px 0;font-weight: bold;text-align: center;padding: 2px 7px;background: #DC7118 url("'+ addon.getResourceURI("images/title-bg.png").spec+'") repeat-x 0 -5px;border: 1px solid #DC7118;text-shadow: 0px 0 1px #333; -moz-border-radius: 3px;color: white;';
	var style4 = 'font-weight: bold;text-align: right;vertical-align: baseline;font-family: "HelveticaNeue-Light","Helvetica Neue Light","Helvetica Neue",Helvetica;letter-spacing: 1pt;';
	let btcvenTT = xul("tooltip");
	btcvenTT.setAttribute("id", "btcven-tooltip");
	btcvenTT.setAttribute("orient", "btcven-tooltip");
	btcvenTT.setAttribute("style", "background-color: #33DD00;");
	btcvenTT.addEventListener("popupshowing", mtgox, true);
	btcvenTT.setAttribute("noautohide", "true");
	let btcvenTTVB = xul("vbox");
	btcvenTTVB.setAttribute("class", "tooltip");
	let btcvenTTVBVB = xul("vbox");
	btcvenTTVBVB.setAttribute("id", "btcven");
	btcvenTTVBVB.setAttribute("class", "btcven-day");
	let btcvenTTVBVBLB1 = xul("label");
	btcvenTTVBVBLB1.setAttribute("id", "btcvenTTVBVBLB1");
	btcvenTTVBVBLB1.setAttribute("style", style3);
	btcvenTTVBVBLB1.setAttribute("value", _("avg", getPref("locale")));
	//let btcvenTTVBVBHB = xul("hbox"); //To be filled by the program
	btcvenTTVBVB.appendChild(btcvenTTVBVBLB1);
				
				var c1 = xul('label');
				var c2 = xul('label');
				var c3 = xul('label');
				var c4 = xul('label');
				var c5 = xul('label');
				var c6 = xul('label');
				var c7 = xul('label');
				var c8 = xul('label');
				var c9 = xul('label');
				var c10 = xul('label');
				c1.setAttribute('flex', '1');
				c1.setAttribute('value', '0');
				c8.setAttribute('flex', '1');
				c8.setAttribute('value', '0');
				c9.setAttribute('flex', '1');
				c9.setAttribute('value', '0');
				c10.setAttribute('flex', '1');
				c10.setAttribute('value', '0');
				c2.setAttribute('value', 'USD');
				c5.setAttribute('value', 'EUR');
				c6.setAttribute('value', 'VEF');
				c7.setAttribute('value', 'ARS');
				c3.setAttribute('value', '=');
				c4.setAttribute('style', style1);
				c2.setAttribute('style', style2);
				c5.setAttribute('style', style2);
				c6.setAttribute('style', style2);
				c7.setAttribute('style', style2);
				c1.setAttribute('style', style4);
				c8.setAttribute('style', style4);
				c9.setAttribute('style', style4);
				c10.setAttribute('style', style4);
				c4.setAttribute('value', '1 BTC');
				
				var row = xul('hbox');
				row.appendChild(c1);
				row.appendChild(c2);
				row.appendChild(c3);
				row.appendChild(c4);
				
				var row2 = xul('hbox');
				row2.appendChild(c8);
				row2.appendChild(c5);
				row2.appendChild(c3.cloneNode(false));
				row2.appendChild(c4.cloneNode(false));
				
				var row3 = xul('hbox');
				row3.appendChild(c9);
				row3.appendChild(c6);
				row3.appendChild(c3.cloneNode(false));
				row3.appendChild(c4.cloneNode(false));
				
				var row4 = xul('hbox');
				row4.appendChild(c10);
				row4.appendChild(c7);
				row4.appendChild(c3.cloneNode(false));
				row4.appendChild(c4.cloneNode(false));

	btcvenTTVBVB.appendChild(row);
	btcvenTTVBVB.appendChild(row2);
	btcvenTTVBVB.appendChild(row3);
	btcvenTTVBVB.appendChild(row4);
	//btcvenTTVBVB.appendChild(btcvenTTVBVBHB);
	btcvenTTVB.appendChild(btcvenTTVBVB);
	btcvenTT.appendChild(btcvenTTVB);

	($("navigator-toolbox") || $("mail-toolbox")).appendChild(btcvenTT);
	
	function mtgox(){
		let urlUSD = "http://bitcoinvenezuela.com/api/btcven.json";
		let requestUSD = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
					  .createInstance(Components.interfaces.nsIXMLHttpRequest);
		requestUSD.onload = function(aEvent) {
		  let text = aEvent.target.responseText;
		  let jsObject = JSON.parse(text);
			c1.setAttribute("value", formatMoney(jsObject.BTC.USD, 2, ',', '.'));
			c8.setAttribute("value",  formatMoney(jsObject.BTC.EUR, 2, ',', '.'));
			c9.setAttribute("value", formatMoney(jsObject.BTC.VEF, 2, ',', '.'));
			c10.setAttribute("value", formatMoney(jsObject.BTC.ARS, 2, ',', '.'));
		};
		requestUSD.onerror = function(aEvent) {
		   LOG("Error Status: " + aEvent.target.status);
		};
		requestUSD.open("GET", urlUSD, true);
		requestUSD.send(null);
		

	}

  // add toolbar button
  let btcvenTBB = xul("toolbarbutton");
  btcvenTBB.setAttribute("id", "btcven-toolbarbutton");
  btcvenTBB.setAttribute("type", "button");
  btcvenTBB.setAttribute("image", addon.getResourceURI("icon16.svg").spec);
  btcvenTBB.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
  btcvenTBB.setAttribute("label", _("btcven", getPref("locale")));
  btcvenTBB.setAttribute("tooltip", "btcven-tooltip");
  //btcvenTBB.setAttribute("context", "btcven-contextmenu");

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
  prefs = prefs.QueryInterface(Components.interfaces.nsIPrefBranch);
  prefs.addObserver("", PREF_OBSERVER, false);
  unload(function() prefs.removeObserver("", PREF_OBSERVER));
};
function shutdown(data, reason) unload()


function LOG(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(msg);
}

formatMoney = function(n, c, d, t){ 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };