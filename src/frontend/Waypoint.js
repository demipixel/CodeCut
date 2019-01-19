
class Waypoint {
  constructor(snippet) {
    this.snippet = snippet;
    this.snippetTime = 0;

    this.hitCode = '';
    this.tickCode = '';
    this.endCode = '';
  }

  beenHit(time)  {
    return time >= this.snippetTime;
  }
}

module.exports = Waypoint;