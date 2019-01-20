
class Waypoint {
  constructor(snippet, snippetTime=0) {
    this.snippet = snippet; // Snippet that this waypoint belongs to
    this.snippetTime = snippetTime; // Time of the waypoints relative to the snippet
    this.dom = null;

    this.hitCode = '';  // Code called when the waypoint is hit (only once)
    this.tickCode = ''; // Code called every frame after this waypoint but before the next one
    this.endCode = ''; //  Code called right before the next waypoint is hit
  }

  beenHit(time)  {
    return time >= this.snippetTime;
  }

  remove() {
    this.dom.remove();
    this.snippet.removeWaypoint(this);
  }

  move(time) {
    this.snippetTime = time;
    this.snippet.fixWaypointOrder(this);
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

module.exports = Waypoint;