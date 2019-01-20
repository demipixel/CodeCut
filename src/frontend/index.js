const PIXI = require('pixi.js');
const Timeline = require('./Timeline');

function init() {
  const pixiApp = new PIXI.Application(800, 600, { backgroundColor: 0x111111 });
  document.getElementById('canvas-container').appendChild(pixiApp.view);

  const TimeVisualizer = require('./visuals/TimeVisualizer')();
  const CodeEditor = require('./visuals/CodeEditor')();
  const TimelineVisuals = require('./visuals/TimelineVisuals')(TimeVisualizer, CodeEditor);
  const mainTimeline = new Timeline(pixiApp, TimelineVisuals);
  window.timeline = mainTimeline;
  mainTimeline.TimelineVisuals.addSnippetLines(mainTimeline);
  init.events = require('./events')(mainTimeline);
}

module.exports = init;