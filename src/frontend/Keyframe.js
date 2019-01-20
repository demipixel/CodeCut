
class Keyframe {
  constructor(snippet, snippetTime=0) {
    this.snippet = snippet; // Snippet that this keyframe belongs to
    this.snippetTime = snippetTime; // Time of the keyframes relative to the snippet
    this.dom = null;

    this.hitCode = '';  // Code called when the keyframe is hit (only once)
    this.tickCode = ''; // Code called every frame after this keyframe but before the next one
    this.endCode = ''; //  Code called right before the next keyframe is hit
  }

  beenHit(time)  {
    return time >= this.snippetTime;
  }

  remove() {
    this.dom.remove();
    this.snippet.removeKeyframe(this);
  }

  move(time) {
    this.snippetTime = time;
    this.snippet.fixKeyframeOrder(this);
  }

  exportObject() {
    return {
      snippetTime: this.snippetTime,
      hitCode: this.hitCode,
      tickCode: this.tickCode,
      endCode: this.endCode
    };
  }

  importObject(obj) {
    this.snippetTime = obj.snippetTime;
    this.hitCode = obj.hitCode;
    this.tickCode = obj.tickCode;
    this.endCode = obj.endCode;
  }
}

module.exports = Keyframe;