var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");

var button = ToggleButton({
  id: "btcven",
  label: "btcven",
  icon: {
    "16": "./icon16.svg",
    "32": "./icon32.svg",
    "64": "./icon64.svg"
  },
  onChange: handleChange
});

var panel = panels.Panel({
  width: 140,
  height: 100,
  contentURL: 'http://api.bitcoinvenezuela.com/?html=yes&look=clean&align=right',
  onHide: handleHide
});

function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
  }
}

function handleHide() {
  button.state('window', {checked: false});
}