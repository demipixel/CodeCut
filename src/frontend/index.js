const PIXI = require('pixi.js');
const Timeline = require('./Timeline');
const Capture = require('./capture.js');


function init() {
  const pixiApp = new PIXI.Application(1920, 1080, { backgroundColor: 0x000000 });
  document.getElementById('canvas-container').appendChild(pixiApp.view);
  function resize() {
    pixiApp.view.style.width = window.innerWidth / 2;
    pixiApp.view.style.height = pixiApp.view.style.width / pixiApp.screen.width * pixiApp.screen.height;
  }
  resize();
  document.addEventListener('resize', resize);

  const TimeVisualizer = require('./visuals/TimeVisualizer')();
  const CodeEditor = require('./visuals/CodeEditor')();
  const TimelineVisuals = require('./visuals/TimelineVisuals')(TimeVisualizer, CodeEditor);
  const mainTimeline = new Timeline(pixiApp, TimelineVisuals);
  window.timeline = mainTimeline;
  mainTimeline.addLine();
  init.events = require('./events')(mainTimeline);
  Capture(60, mainTimeline);
  
}

module.exports = init;