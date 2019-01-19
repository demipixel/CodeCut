const PIXI = require('pixi.js');
const Timeline = require('./Timeline');

function init() {
  const app = new PIXI.Application(800, 600, { backgroundColor: 0x000000 });
  document.getElementById('canvas_container').appendChild(app.view);

  const mainTimeline = new Timeline();
  window.timeline = mainTimeline;
}

module.exports = init;