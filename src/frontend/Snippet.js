const Waypoint = require('./Waypoint');

// This is basically a node on some snippet line with a length
// It's the box on the timeline that renders something and has
// waypoints
class Snippet {
  constructor(snippetLine, pixiContainer, parentClass=null, start=0) {
    // All units are in seconds.
    this.snippetLine = snippetLine;
    this.pixiContainer = pixiContainer;
    this.dom = null;
    this.parentClass = parentClass; // Do not use for now
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
      this.active = true;
    }

    // Basically, this happens if we scrub.
    if (reparseWaypoints) this.reparseWaypoints(timeInSnippet);

    // Have we hit the next waypoint? If so, that's our new waypoint.
    if (this.nextWaypoint && this.nextWaypoint.beenHit(timeInSnippet)) {
      if (this.currentWaypointIndex != -1) {
        this.node['waypoint_'+this.currentWaypointIndex+'_end'](PIXI);
      }
      this.currentWaypoint = this.nextWaypoint;
      this.currentWaypointIndex++;
      console.log('Hit waypoint!');
      console.log(this.currentWaypointIndex, this.node['waypoint_'+this.currentWaypointIndex+'_hit'].toString());
      this.node['waypoint_'+this.currentWaypointIndex+'_hit'](PIXI);
    }

    // Handle waypoints
    if (this.currentWaypoint) {
      this.node['waypoint_'+this.currentWaypointIndex+'_tick'](
        PIXI,
        timeInSnippet  - this.currentWaypoint.snippetTime,
        timeInSnippet,
        (this.nextWaypoint ? this.nextWaypoint.snippetTime : this.length) - this.currentWaypoint.snippetTime
      );
    }

    // Run the tick function on the user's custom code
    this.node.tick(PIXI, timeInSnippet);
  }

  addWaypoint(snippetTime=0) {
    const waypoint = new Waypoint(this, snippetTime);

    // Insert into waypoints such that waypoints remains sorted
    let indexOfWaypoint = -1;
    for (let i = 0; i < this.waypoints.length; i++) {
      if (this.waypoints[i].snippetTime < snippetTime) continue;
      else if (this.waypoints[i].snippetTime == snippetTime) {
        throw new Error('Two waypoints cannot occur at the same time!');
      }

      this.waypoints.splice(i, 0, waypoint);
      indexOfWaypoint = i;
      break;
    }

    if (indexOfWaypoint == -1) this.waypoints.push(waypoint);

    this.deactivate();
    this.snippetLine.update(false, true);

    this.snippetLine.timeline.TimelineVisuals.updateWaypoints(this);

    return waypoint;
  }

  removeWaypoint(waypoint) {
    const index = this.waypoints.indexOf(waypoint);
    if (index == -1) return false;

    this.waypoints.splice(index, 1);
    this.deactivate();
    this.snippetLine.update(false, true);
    return true;
  }

  fixWaypointOrder(waypoint) {
    let index = this.waypoints.indexOf(waypoint);
    if (index == -1) return false;

    let changed = false;
    while (index != this.waypoints.length - 1 &&
            this.waypoints[index+1].snippetTime < this.waypoints[index].snippetTime) {
      console.log(this.waypoints[index+1].snippetTime, this.waypoints[index].snippetTime);
      const tmp = this.waypoints[index+1];
      this.waypoints[index+1] = this.waypoints[index];
      this.waypoints[index] = tmp;
      index++;
      changed = true;
    }

    if (changed) {
      this.deactivate();
      this.snippetLine.update(false, true);
    }
  }

  get nextWaypoint() {
    return this.waypoints[this.currentWaypointIndex+1];
  }

  waypointAtTime(snippetTime, ignoreWaypoint) {
    for (let w = 0; w < this.waypoints.length; w++) {
      if (this.waypoints[w] == ignoreWaypoint) continue;
      if (this.waypoints[w].snippetTime < snippetTime) continue;
      else if (this.waypoints[w].snippetTime == snippetTime) return true;
      else return false;
    }
    return false;
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

    // Respawning the node every time may be INCREDIBLY inefficient
    // Better ways to do it? Problem with just calling init is that it
    // doesn't clearly any data that may have been saved in the object
    // by other waypoints or tick()
    if (!skippedAhead) this.respawnNodeInstance();
    for (let i = startIndex; i <= endIndex; i++) {
      if (i != 0) this.node['waypoint_'+(i-1)+'_end'](PIXI);
      this.node['waypoint_'+i+'_hit'](PIXI);
    }
  }

  get nextSnippet() {
    const index = this.snippetLine.snippets.indexOf(this);
    return this.snippetLine.snippets[index+1] || null;
  }

  get previousSnippet() {
    const index = this.snippetLine.snippets.indexOf(this);
    return this.snippetLine.snippets[index-1] || null;
  }

  updateNodeCode() {
    this.destroyNodePixi();

    // Parent classes are not supported yet.
    // May be usedful when we implement prefabs.

    // const superClass = PIXI[this.parentClass];
    // const generatedClass = class GeneratedClass extends superClass {}

    this.generatedClass = function() { this.pixi = null; };
    

    // Eventually put try/catch around this and dump error to user
    this.generatedClass.prototype.init = eval('(function(PIXI){'+this.initCode+'})');
    this.generatedClass.prototype.tick = eval('(function(PIXI, time){'+this.tickCode+'})');

    for (let w = 0; w < this.waypoints.length; w++) {
      const waypoint = this.waypoints[w];
      this.generatedClass.prototype['waypoint_'+w+'_hit'] = eval('(function(PIXI){'+waypoint.hitCode+'})');
      this.generatedClass.prototype['waypoint_'+w+'_tick'] = eval('(function(PIXI, time, nodeTime, length){'+waypoint.tickCode+'})');
      this.generatedClass.prototype['waypoint_'+w+'_end'] = eval('(function(PIXI){'+waypoint.endCode+'})');
    }

    this.respawnNodeInstance();
  }

  respawnNodeInstance() {
    this.destroyNodePixi();
    this.node = new this.generatedClass();
    this.node.pixi = new PIXI.Graphics();
    this.node.init();
    this.pixiContainer.addChild(this.node.pixi);
  }

  timeInside(time) {
    return time < this.start + this.length && time >= this.start;
  }

  deactivate() {
    this.active = false;
    this.destroyNodePixi();
    this.node = null;
    this.currentWaypointIndex = -1;
    this.currentWaypoint = null;
  }

  remove() {
    this.dom.remove();
    this.snippetLine.removeSnippet(this);
  }

  destroyNodePixi() {
    if (this.node && this.node.pixi && this.node.pixi.parent) {
      this.node.pixi.parent.removeChild(this.node);
      this.node.pixi.destroy({children:true, texture:true, baseTexture:true});
    }
  }
}

module.exports  = Snippet;