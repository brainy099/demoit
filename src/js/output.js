import el from './utils/element';
import { DEBUG } from './constants';

var m = 0;
const markers = {};
const DEFAULT_HINT = '<div class="centered">&lt;div id="output" /&gt;</div>';
const createMessageSender = (iframe, addToConsole, clearConsole) => {
  window.addEventListener('message', function (e) {
    if (e.data.marker) {
      DEBUG && console.log('<-- ' + e.data.marker);
      if (markers[e.data.marker]) {
        markers[e.data.marker].done();
        delete markers[e.data.marker];
      }
    } else if (e.data.log) {
      addToConsole(e.data.log);
    } else if (e.data.op) {
      DEBUG && console.log('<-- ' + e.data.op);
      clearConsole();
    }
  });
  return (op, value, customMarker = null) => {
    const markerId = ++m;

    DEBUG && console.log('Demoit -> op=' + op + ' markerId=' + markerId);
    return new Promise(done => {
      markers[customMarker ? customMarker : markerId] = { done, op, value };
      if (iframe.e.contentWindow) {
        iframe.e.contentWindow.postMessage({
          op,
          value,
          marker: markerId
        }, '*');
      }
    });
  };
};

export default async function output(state, addToConsole, clearConsole) {
  const output = el.withFallback('.output');
  const iframe = output.find('#sandbox');
  const sendMessage = createMessageSender(iframe, addToConsole, clearConsole);

  return {
    setOutputHTML: async function clearOutput(hintValue = DEFAULT_HINT) {
      return sendMessage('html', hintValue);
    },
    resetOutput: async function () {
      return await sendMessage('reload', null, 'loaded');
    },
    loadDependenciesInOutput: async function () {
      return sendMessage('dependencies', state.getDependencies());
    },
    executeInOut: async function (value) {
      return sendMessage('code', value);
    }
  };
}
