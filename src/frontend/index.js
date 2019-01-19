const PIXI = require('pixi.js');
const Timeline = require('./Timeline');

function init() {
  const pixiApp = new PIXI.Application(800, 600, { backgroundColor: 0x000000 });
  document.getElementById('canvas_container').appendChild(pixiApp.view);

  const mainTimeline = new Timeline(pixiApp);
  window.timeline = mainTimeline;
  init.events = require('./events')(mainTimeline);
}

module.exports = init;