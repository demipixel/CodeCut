const safeEval = require('safe-eval');

// This is basically an instance of a node (gets )
class Snippet {
  constructor(parentClass=null, start=0) {
    // All units are in seconds.
    this.parentClass = parentClass || 'PIXI.Container'
    this.node = null;
    this.start = start;
    this.length = 1;
    // If not active, when updated, we will create the nodeClass
    this.active = false;

    this.initCode = '';
    this.tickCode = '';

    // Should *always* be sorted in order of time that the waypoint occurs
    // No two waypoints should be able to be at the same time
    this.waypoints = [];
    // Works just like currentSnippet (See NodeLine comments for details)
    // Notice this CAN have a -1 index (before the first waypoint)
    this.currentWaypoint = null;
    this.currentWaypointIndex = -1;
  }

  
  update(timeInSnippet, reparseWaypoints)  {
    if (!this.active) {
      this.updateNodeCode();
    }

    if (reparseWaypoints) this.reparseWaypoints(timeInSnippet);

    if (this.nextWaypoint && this.nextWaypoint.beenHit(timeInSnippet)) {
      this.currentWaypoint = this.nextWaypoint;
      this.currentWaypointIndex++;
    }
  }

  get nextWaypoint() {
    return this.waypoints[this.currentWaypointIndex+1];
  }

  reparseWaypoints(timeInSnippet) {
    const oldWaypointIndex = this.currentWaypointIndex;
    this.currentWaypointIndex = -1;
    this.currentWaypoint = null;
    for (let i = 0; i < this.waypoints.length; i++) {
      if (this.waypoints[i].beenHit(timeInSnippet)) {
        this.currentWaypoint = this.waypoints[i];
        this.currentWaypointIndex = i;
      } else {
        break;
      }
    }

    // Don't need to reparse jack shit, we're on the same waypoint dumbass
    if (oldWaypointIndex == this.currentWaypointIndex) return;
    
    // If the new current waypoint is AHEAD of the old one,
    // we only parse the new waypoints 'til then.
    // Otherwise, we parse from the start to new current waypoint.
    const skippedAhead = this.currentWaypointIndex > oldWaypointIndex;
    const startIndex = skippedAhead ? oldWaypointIndex + 1 : 0;
    const endIndex = this.currentWaypointIndex;

    for (let i = startIndex; i <= endIndex; i++) {
      if (i != 0) this.node['waypoint_'+(i-1)+'_end']();
      this.node['waypoint_'+i+'_hit']();
    }
  }

  updateNodeCode() {
    const generatedClass = function() { this.init(); }

    generatedClass.prototype.init = eval(this.initCode);
    generatedClass.prototype.tick = eval(this.tickCode);

    for (let w = 0; w < this.waypoints.length; w++) {
      const waypoint = this.waypoints[w];
      generatedClass.prototype['waypoint_'+w+'_hit'] = waypoint.hitCode;
      generatedClass.prototype['waypoint_'+w+'_tick'] = waypoint.tickCode;
      generatedClass.prototype['waypoint_'+w+'_end'] = waypoint.endCode;
    }

    this.node = new generatedClass();
  }

  timeInside(time) {
    return time < this.start + this.length && time >= this.start;
  }

  deactivate() {
    this.active = false;
    this.node = null;
  }
}

module.exports  = Snippet;