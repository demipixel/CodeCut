const NodeLine = require('./NodeLine');

// Main timeline. This pretty much handles everything regarding
// editing, previewing, and exporting.
class Timeline {
  constructor() {
    this.nodeLines = [];
    this.previewTime = 0;
    this.playing = false;
    this.skipFramesIfNeeded = true;
    this.previewFps = 60;
    this.previewSpeedScalar = 1.0;

    this.lastPreviewFrameTime = Date.now();
  }

  addLine() {
    this.nodeLines.push(new NodeLine(this));
  }

  // Play preview
  play() {
    if (this.playing) return this;
    this.playing = true;
    this.tick(true); // Pass in true because we don't
    // want to increase previewTime immediately
    return this;
  }

  // Pause preview
  pause() {
    if (!this.playing) return this;
    this.playing = false;
  }

  scrub(time) {
    if (this.playing) this.playing = false;
    this.previewTime = time;
    this.update(true);
    return this;
  }

  // Tick preview (unknown number of frames)
  // May be faster than the normal 60fps
  // Preview may run slowly
  // Will skip frames if that option is enabled
  tick(first=false) {
    const delta = (Date.now() - this.lastPreviewFrameTime)/1000;
    this.lastPreviewFrameTime = Date.now();
    if (!this.playing) return;

    if (!first) { // If this is the first tick, don't increment previewTime
      if (this.skipFramesIfNeeded) this.previewTime += delta * this.previewSpeedScalar;
      else this.previewTime += Math.max(1/this.previewFps, delta);
    }

    this.update();

    // Not requestAnimationFrame(this.tick) because I'm worried
    // it will break `this` (such as if we did setInterval(this.tick))
    requestAnimationFrame(() => {
      this.tick();
    });
  }

  update() {
    for (let i = 0; i < this.nodeLines.length; i++) {
      this.nodeLines.update();
    }
  }

  exportAsObject() {
    return {};
  }

  importAsObject(obj) {
    // Do something
    obj;
  }
}

module.exports = Timeline;