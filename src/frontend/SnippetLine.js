const PIXI = require('pixi.js');
const Snippet = require('./Snippet');

// A line that will contain a video/node snippet.
// The reason this isn't just the timeline is because you want
// to have multiple nodes running at the same time, so you put
// them on different lines (maybe "layers" in other apps?) to
// have them "overlap"
class SnippetLine {
  constructor(timeline) {
    this.timeline = timeline;
    this.pixiContainer = new PIXI.Container();
    this.timeline.pixiApp.stage.addChild(this.pixiContainer);

    // Should *always* be sorted in order of time that the snippets occurs
    // Snippets should not overlap
    this.snippets = [];

    this.currentSnippet = null;
    // May contain a value even if currentSnippet is null
    // This means that this is the next index (if we continue playing)
    this.currentSnippetIndex = 0;
  }

  newSnippet(parentClass, start) {
    const snippet = new Snippet(this, this.pixiContainer, parentClass, start);
    
    // Insert into snippets such that snippets remains sorted
    let indexOfSnippet = -1;
    for (let i = 0; i < this.snippets.length; i++) {
      if (this.snippets[i].start < start) continue;

      this.snippets.splice(i, 0, snippet);
      indexOfSnippet = i;
      break;
    }

    // Wasn't before any existing snippet, so just add it to the end
    if (indexOfSnippet == -1) this.snippets.push(snippet);
    else {
      const maxSnippetLength = this.snippets[indexOfSnippet].start - snippet.start;
      snippet.length = Math.min(snippet.length, maxSnippetLength);
    }

    this.timeline.TimelineVisuals.addSnippet(
      this.timeline.snippetLines.indexOf(this), // Get this snippet-line number
      (indexOfSnippet + this.snippets.length) % this.snippets.length, // Index of snippet
      snippet
    );

    return snippet;
  }

  // Update snippet that is active
  update(hardSearch) {
    // If hardSearch is true, we just scrubbed somewhere
    // and need to search for the snippet to update/render
    if (hardSearch) {
      const oldSnippet = this.currentSnippet;
      this.currentSnippet = null;
      this.currentSnippetIndex = 0;
      for (let i = 0; i < this.snippets.length; i++) {
        this.currentSnippetIndex = i;
        if (this.snippets[i].timeInside(this.timeline.previewTime)) {
          this.currentSnippet = this.snippets[i];
          break;
        }
      }
      if (oldSnippet && this.currentSnippet != oldSnippet) {
        oldSnippet.deactivate();
      }
    } else {
      // Handle ending current snippet
      if (this.currentSnippet && !this.currentSnippet.timeInside(this.timeline.previewTime)) {
        this.currentSnippetIndex++;
        this.currentSnippet.deactivate();
        this.currentSnippet = null;
      }
      // Handle activating next snippet
      if (!this.currentSnippet && this.currentSnippetIndex < this.snippets.length &&
            this.snippets[this.currentSnippetIndex].timeInside(this.timeline.previewTime)) {
          this.currentSnippet = this.snippets[this.currentSnippetIndex];
      }
    }

    if (!this.currentSnippet) return;

    // Update our snippet!
    if (this.currentSnippet.timeInside(this.timeline.previewTime)) {
      this.currentSnippet.update(this.timeline.previewTime - this.currentSnippet.start, hardSearch);
    }
  }
}

module.exports = SnippetLine;
