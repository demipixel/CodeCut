
// A line that will contain a video/node snippet.
// The reason this isn't just the timeline is because you want
// to have multiple nodes running at the same time, so you put
// them on different lines (maybe "layers" in other apps?) to
// have them "overlap"
class NodeLine {
  constructor(timeline) {
    this.timeline = timeline;

    // Should *always* be sorted in order of time that the snippets occurs
    // Snippets should not overlap
    this.snippets = [];

    this.currentSnippet = null;
    // May contain a value even if currentSnippet is null
    // This means that this is the next index (if we continue playing)
    this.currentSnippetIndex = 0;
  }

  // Update snippet that is active
  update(hardSearch) {
    // If hardSearch is true, we just scrubbed somewhere
    // and need to search for the snippet to update/render
    if (hardSearch) {
      const oldSnippet = this.currentSnippet;
      for (let i = 0; i < this.snippets.length; i++) {
        this.currentSnippetIndex = i;
        if (this.snippets[i].timeInside(this.timeline.previewTime)) {
          this.currentSnippet = this.snippets[i];
          break;
        }
      }
    } else {
      // Handle ending current snippet
      if (this.currentSnippet && this.currentSnippet.timeInside(this.timeline.previewTime)) {
        this.currentSnippetIndex++;
        this.currentSnippet.deactivate();
        this.currentSnippet = null;
      }
      // Handle activating next snippet
      if (!this.currentSnippet && this.currentSnippet.timeInside(this.timeline.previewTime)) {
          this.currentSnippet = this.snippets[this.currentSnippetIndex];
      }
    }

    if (!this.currentSnippet) return;

    // Update our snippet!
    if (this.timeline.previewTime >= this.currentSnippet.start) {
      this.currentSnippet.update(this.timeline.previewTime - this.currentSnippet.start);
    }
  }
}

module.exports = NodeLine;
