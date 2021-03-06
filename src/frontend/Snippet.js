const Keyframe = require('./Keyframe');
const EasingFunctions = require('./utils/EasingFunctions');

// This is basically a node on some snippet line with a length
// It's the box on the timeline that renders something and has
// keyframes
class Snippet {
  constructor(snippetLine, parentClass=null, start=0) {
    // All units are in seconds.
    this.snippetLine = snippetLine;
    this.pixiContainer = snippetLine.pixiContainer;
    this.dom = null;
    this.parentClass = parentClass; // Do not use for now
    this.node = null;
    this.start = start;
    this.length = 1;
    // If not active, when updated, we will create the nodeClass
    this.active = false;

    this.initCode = '';
    this.tickCode = '';

    // Should *always* be sorted in order of time that the keyframe occurs
    // No two keyframes should be able to be at the same time
    this.keyframes = [];
    // Works just like currentSnippet (See NodeLine comments for details)
    // Notice this CAN have a -1 index (before the first keyframe)
    this.currentKeyframe = null;
    this.currentKeyframeIndex = -1;
  }
  
  update(timeInSnippet, reparseKeyframes)  {
    let errors = null;
    if (!this.active) {
      errors = this.updateNodeCode();
      this.active = true;
    }

    // Basically, this happens if we scrub.
    if (reparseKeyframes) this.reparseKeyframes(timeInSnippet);

    // Have we hit the next keyframe? If so, that's our new keyframe.
    if (this.nextKeyframe && this.nextKeyframe.beenHit(timeInSnippet)) {
      if (this.currentKeyframeIndex != -1) {
        this.node['keyframe_'+this.currentKeyframeIndex+'_end'](PIXI, EasingFunctions);
      }
      this.currentKeyframe = this.nextKeyframe;
      this.currentKeyframeIndex++;
      this.node['keyframe_'+this.currentKeyframeIndex+'_hit'](PIXI, EasingFunctions);
    }

    // Handle keyframes
    if (this.currentKeyframe) {
      this.node['keyframe_'+this.currentKeyframeIndex+'_tick'](
        PIXI,
        EasingFunctions,
        timeInSnippet  - this.currentKeyframe.snippetTime,
        timeInSnippet,
        (this.nextKeyframe ? this.nextKeyframe.snippetTime : this.length) - this.currentKeyframe.snippetTime
      );
    }

    // Run the tick function on the user's custom code
    try {
      this.node.tick(PIXI, EasingFunctions, timeInSnippet, this.length);
    } catch (e) {
      console.error('tick() Error:', e);
      errors.push(e);
    }

    return errors;
  }

  addKeyframe(snippetTime=0) {
    const keyframe = new Keyframe(this, snippetTime);

    // Insert into keyframes such that keyframes remains sorted
    let indexOfKeyframe = -1;
    for (let i = 0; i < this.keyframes.length; i++) {
      if (this.keyframes[i].snippetTime < snippetTime) continue;
      else if (this.keyframes[i].snippetTime == snippetTime) {
        throw new Error('Two keyframes cannot occur at the same time!');
      }

      this.keyframes.splice(i, 0, keyframe);
      indexOfKeyframe = i;
      break;
    }

    if (indexOfKeyframe == -1) this.keyframes.push(keyframe);

    this.deactivate();
    this.snippetLine.update(false, true);

    this.snippetLine.timeline.TimelineVisuals.updateKeyframes(this);

    return keyframe;
  }

  removeKeyframe(keyframe) {
    const index = this.keyframes.indexOf(keyframe);
    if (index == -1) return false;

    this.keyframes.splice(index, 1);
    this.deactivate();
    this.snippetLine.update(false, true);
    return true;
  }

  fixKeyframeOrder(keyframe) {
    let index = this.keyframes.indexOf(keyframe);
    if (index == -1) return false;

    let changed = false;
    while (index != this.keyframes.length - 1 &&
            this.keyframes[index+1].snippetTime < this.keyframes[index].snippetTime) {
      const tmp = this.keyframes[index+1];
      this.keyframes[index+1] = this.keyframes[index];
      this.keyframes[index] = tmp;
      index++;
      changed = true;
    }

    if (changed) {
      this.deactivate();
      this.snippetLine.update(false, true);
    }
  }

  get nextKeyframe() {
    return this.keyframes[this.currentKeyframeIndex+1];
  }

  keyframeAtTime(snippetTime, ignoreKeyframe) {
    for (let w = 0; w < this.keyframes.length; w++) {
      if (this.keyframes[w] == ignoreKeyframe) continue;
      if (this.keyframes[w].snippetTime < snippetTime) continue;
      else if (this.keyframes[w].snippetTime == snippetTime) return true;
      else return false;
    }
    return false;
  }

  reparseKeyframes(timeInSnippet) {
    const oldKeyframeIndex = this.currentKeyframeIndex;
    this.currentKeyframeIndex = -1;
    this.currentKeyframe = null;
    for (let i = 0; i < this.keyframes.length; i++) {
      if (this.keyframes[i].beenHit(timeInSnippet)) {
        this.currentKeyframe = this.keyframes[i];
        this.currentKeyframeIndex = i;
      } else {
        break;
      }
    }

    // Don't need to reparse jack shit, we're on the same keyframe dumbass
    if (oldKeyframeIndex == this.currentKeyframeIndex) return;
    
    // If the new current keyframe is AHEAD of the old one,
    // we only parse the new keyframes 'til then.
    // Otherwise, we parse from the start to new current keyframe.
    const skippedAhead = this.currentKeyframeIndex > oldKeyframeIndex;
    const startIndex = skippedAhead ? oldKeyframeIndex + 1 : 0;
    const endIndex = this.currentKeyframeIndex;

    // Respawning the node every time may be INCREDIBLY inefficient
    // Better ways to do it? Problem with just calling init is that it
    // doesn't clearly any data that may have been saved in the object
    // by other keyframes or tick()
    if (!skippedAhead) this.respawnNodeInstance();
    for (let i = startIndex; i <= endIndex; i++) {
      if (i != 0) this.node['keyframe_'+(i-1)+'_end'](PIXI, EasingFunctions);
      this.node['keyframe_'+i+'_hit'](PIXI, EasingFunctions);
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

    this.generatedClass = function() { this.pixi = null; this.pixiApp = null; };
    const errors = [];
    

    // Eventually put try/catch around this and dump error to user
    try {
      this.generatedClass.prototype.init = eval('(function(PIXI, EASING){'+this.initCode+'})');
    } catch (e) {
      errors.push(e);
      this.generatedClass.prototype.init = () => {};
    }
    try {
      this.generatedClass.prototype.tick = eval('(function(PIXI, EASING, time, nodeTime){'+this.tickCode+'})');
    } catch (e) {
      errors.push(e);
      this.generatedClass.prototype.tick = () => {};
    }

    for (let w = 0; w < this.keyframes.length; w++) {
      const keyframe = this.keyframes[w];
      try {
        this.generatedClass.prototype['keyframe_'+w+'_hit'] = eval('(function(PIXI, EASING){'+keyframe.hitCode+'})');
      } catch (e) {
        errors.push(e);
        this.generatedClass.prototype['keyframe_'+w+'_hit'] = () => {};
      }
      try {
        this.generatedClass.prototype['keyframe_'+w+'_tick'] = eval('(function(PIXI, EASING, time, nodeTime, length){'+keyframe.tickCode+'})');
      } catch (e) {
        errors.push(e);
        this.generatedClass.prototype['keyframe_'+w+'_tick'] = () => {};
      }
      try {
        this.generatedClass.prototype['keyframe_'+w+'_end'] = eval('(function(PIXI, EASING){'+keyframe.endCode+'})');
      } catch (e) {
        errors.push(e);
        this.generatedClass.prototype['keyframe_'+w+'_end'] = () => {};
      }
    }

    const error  = this.respawnNodeInstance();
    if (error) errors.push(error);

    return errors;
  }

  respawnNodeInstance() {
    let error = null;
    this.destroyNodePixi();
    this.node = new this.generatedClass();
    this.node.pixi = new PIXI.Graphics();
    this.node.pixiApp = this.snippetLine.timeline.pixiApp;
    try {
      this.node.init(PIXI, EasingFunctions);
    } catch (e) {
      console.error('init() Error:', e);
      error =  e;
    }
    this.pixiContainer.addChild(this.node.pixi);
    return error;
  }

  timeInside(time) {
    return time < this.start + this.length && time >= this.start;
  }

  deactivate() {
    this.active = false;
    this.destroyNodePixi();
    this.node = null;
    this.currentKeyframeIndex = -1;
    this.currentKeyframe = null;
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

  exportObject() {
    return {
      start: this.start,
      length: this.length,
      initCode: this.initCode,
      tickCode: this.tickCode,

      keyframes: this.keyframes.map(k => k.exportObject())
    };
  }

  importObject(obj) {
    this.start = obj.start;
    this.length = obj.length;
    this.initCode = obj.initCode;
    this.tickCode = obj.tickCode;
    this.keyframes = [];
    for (let k = 0; k < obj.keyframes.length; k++) {
      this.keyframes[k] = new Keyframe(this);
      this.keyframes[k].importObject(obj.keyframes[k]);
    }
    this.snippetLine.timeline.TimelineVisuals.updateKeyframes(this);
  }
}

module.exports  = Snippet;