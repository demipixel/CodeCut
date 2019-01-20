const SnippetLine = require('./SnippetLine');

// Main timeline. This pretty much handles everything regarding
// editing, previewing, and exporting.
class Timeline {
  constructor(pixiApp, TimelineVisuals) {
    this.pixiApp = pixiApp;
    this.snippetLines = [];
    this.previewTime = 0;
    this.playing = false;
    this.skipFramesIfNeeded = true;
    this.previewFps = 60;
    this.previewSpeedScalar = 1.0;

    this.lastPreviewFrameTime = Date.now();
    this.TimelineVisuals = TimelineVisuals;
  }

  addLine() {
    this.snippetLines.push(new SnippetLine(this));
    this.TimelineVisuals.updateSnippetLines();
  }

  removeLine(line) {
    const index = this.snippetLines.indexOf(line);
    if (index == -1) return false;
    this.snippetLines[index].dom.remove();
    this.snippetLines[index].pixiContainer.destroy();
    this.snippetLines.splice(index, 1);
    return true;
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
    this.TimelineVisuals.setPlayhead(time);
    this.setPreviewTime();
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

    this.setPreviewTime();

    this.update();
    this.TimelineVisuals.setPlayhead(this.previewTime);

    // Not requestAnimationFrame(this.tick) because I'm worried
    // it will break `this` (such as if we did setInterval(this.tick))
    requestAnimationFrame(() => {
      this.tick();
    });
  }

  setPreviewTime() {
    const minutes = (this.previewTime/60 < 10 ? '0' : '') + Math.floor(this.previewTime/60).toString();
    const seconds = ((this.previewTime % 60) < 10 ? '0' : '') + Math.floor(this.previewTime % 60).toString();
    const centiseconds = ((this.previewTime*60 % 60) < 10 ? '0' : '') + Math.floor(this.previewTime*60 % 60).toString();
    document.getElementById('preview-time').innerText = minutes+':'+seconds+':'+centiseconds;
  }

  update(scrubbed) {
    for (let i = 0; i < this.snippetLines.length; i++) {
      this.snippetLines[i].update(scrubbed);
    }
  }

  exportObject() {
    return {
      snippetLines: this.snippetLines.map(s => s.exportObject())
    };
  }

  importObject(obj) {
    for (let i = this.snippetLines.length - 1; i >= 0; i--) {
      this.removeLine(this.snippetLines[i]);
    }
    for (let s = 0; s < obj.snippetLines.length; s++) {
      this.addLine();
      this.snippetLines[s].importObject(obj.snippetLines[s])
    }
    this.scrub(0);
  }
}

module.exports = Timeline;