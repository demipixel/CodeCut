
module.exports = function(TimeVisualizer, CodeEditor) {
  const playheadDom = document.getElementById('playhead');
  let playheadTime = 0;

  function updateSnippetLines() {
    for (let s = 0; s < timeline.snippetLines.length; s++) {
      const snippetLine = timeline.snippetLines[s];
      if (snippetLine.dom) continue;
      const lineDom = document.createElement('div');
      snippetLine.dom = lineDom;
      lineDom.classList.add('snippet-line');
      lineDom.onclick = function(e) {
        if (e.shiftKey) {
          const canvas = document.getElementById('time-visualizer-canvas');
          const pixelsPerSecond = TimeVisualizer.getPixelsPerSecond();
          const timeStart = TimeVisualizer.getTimeStart();
          const time = (e.clientX - canvas.clientLeft) / pixelsPerSecond + timeStart;

          if (snippetLine.snippetInTime(time)) return;
          snippetLine.newSnippet(time);
        }
      }
      document.getElementById('snippet-lines').appendChild(lineDom);
    }
    update();
  }

  function addSnippet(snippet) {
    const lineDom = snippet.snippetLine.dom;
    const snippetDom = document.createElement('div');
    snippet.dom = snippetDom;
    snippetDom.classList.add('snippet');
    addSnippetGrippers(snippetDom, snippet);

    let selected = false;
    addEventListener('keydown', function(e) {
      if (e.key == 'Backspace') {
        if (selected) snippet.remove();
      }
    });
    let snippetClicked = false;
    let startClick = { x: 0, y: 0 };
    let oldStart = 0;
    let oldLength = 0;
    let lastValidMovedSeconds = 0;
    snippetDom.onmousedown = function(e) {
      if (e.path[0] != snippetDom) return;
      e.preventDefault();
      if (!e.shiftKey) { // Normal selecting/moving
        snippetClicked = true;
        startClick.x = e.clientX;
        startClick.y = e.clientY;
        oldStart = snippet.start;
        oldLength = snippet.length;
        document.body.style.cursor = 'move';
        snippetDom.style.cursor = 'move';

        selected =  true;
        snippetDom.classList.add('selected');
      } else { // Add keyframe when shift is held down
        const canvas = document.getElementById('time-visualizer-canvas');
        const pixelsPerSecond = TimeVisualizer.getPixelsPerSecond();
        const timeStart = TimeVisualizer.getTimeStart();
        const time = (e.clientX - canvas.clientLeft) / pixelsPerSecond + timeStart;
        snippet.addKeyframe(time - snippet.start);
      }
    }
    document.addEventListener('mousedown', function(e) {
      if (e.path[0] == snippetDom) return;
      selected = false;
      snippetDom.classList.remove('selected');
    });
    document.addEventListener('mouseup', function(e) {
      snippetClicked = false;
      document.body.style.cursor = '';
      snippetDom.style.cursor = 'pointer';
    });
    document.addEventListener('mousemove', function(e) {
      if (!snippetClicked) return;
      let movedSeconds = (e.clientX - startClick.x) / TimeVisualizer.getPixelsPerSecond();
      // Don't move snippet if we can't place it there.
      if (snippet.snippetLine.snippetInTime(oldStart + movedSeconds, snippet)) {
        movedSeconds = lastValidMovedSeconds;
      }
      snippet.start = Math.max(0, oldStart + movedSeconds);
      // Handle changing length if needed
      const snippetAfter = snippet.snippetLine.snippetAfterTime(Math.max(0, oldStart + movedSeconds));
      if (snippetAfter) {
        snippet.length = Math.min(oldLength, snippetAfter.start - snippet.start);
      } else  {
        snippet.length = oldLength;
      }
      update();
      snippet.snippetLine.update(true);
      lastValidMovedSeconds = movedSeconds;
    });

    snippetDom.ondblclick = function(e) {
      if (e.path[0] != snippetDom) return;
      CodeEditor.editors[0].setValue(snippet.initCode);
      CodeEditor.editors[1].setValue(snippet.tickCode);
      CodeEditor.markSaved(0);
      CodeEditor.markSaved(1);
      const save = () => {
        snippet.deactivate();
        snippet.snippetLine.update(false, true);
      }
      CodeEditor.setSaveLocation(0, snippet, 'initCode', save);
      CodeEditor.setSaveLocation(1, snippet, 'tickCode', save);
      CodeEditor.setHeaderText(0, 'init(PIXI)');
      CodeEditor.setHeaderText(1, 'tick(PIXI, time)');
      CodeEditor.hide(2);

      const editing = document.getElementsByClassName('editing');
      for (let i = 0; i < editing.length; i++) {
        editing[i].classList.remove('editing');
      }

      snippetDom.classList.add('editing');
    }

    lineDom.appendChild(snippetDom);

    update();
  }

  function addSnippetGrippers(snippetDom, snippet) {
    for (let i = 0; i < 2; i++) {
      const gripper = document.createElement('div');
      gripper.classList.add('snippet-edge-gripper');
      if (i == 1) gripper.classList.add('snippet-edge-gripper-right');

      let gripperClicked = false;
      let startClick = { x: 0, y: 0 };
      let oldStart = 0;
      let oldLength = 0;

      gripper.onmousedown = function(e) {
        e.preventDefault();
        gripperClicked = true;
        startClick.x = e.clientX;
        startClick.y = e.clientY;
        oldStart = snippet.start;
        oldLength = snippet.length;
        document.body.style.cursor = 'col-resize';
      }
      document.addEventListener('mouseup', function(e) {
        gripperClicked = false;
        document.body.style.cursor = '';
      });
      document.addEventListener('mousemove', function(e) {
        if (!gripperClicked) return;
        let movedSeconds = (e.clientX - startClick.x) / TimeVisualizer.getPixelsPerSecond();
        if (i == 0) {
          movedSeconds = Math.max(-oldStart, movedSeconds);
          movedSeconds = Math.min(oldLength - 1/240, movedSeconds);
          if (snippet.previousSnippet) {
            movedSeconds = Math.max(
              movedSeconds,
              oldStart - (snippet.previousSnippet.start + snippet.previousSnippet.length)
            );
          }
          snippet.start = oldStart + movedSeconds;
          snippet.length = oldLength - movedSeconds;
        } else {
          if(snippet.nextSnippet) {
            movedSeconds = Math.min(
              movedSeconds,
              snippet.nextSnippet.start - (oldStart + oldLength)
            );
            movedSeconds = Math.max(-oldLength + 1/240, movedSeconds);
          }
          snippet.length = oldLength + movedSeconds;
        }
        update();
        snippet.snippetLine.update(true);
      });
      snippetDom.appendChild(gripper);
    }
  }

  function updateKeyframes(snippet) {
    for (let w = 0; w < snippet.keyframes.length; w++) {
      if (snippet.keyframes[w].dom) continue;

      const keyframeDom = document.createElement('div');
      const keyframe = snippet.keyframes[w];
      keyframe.dom = keyframeDom;
      keyframeDom.classList.add('keyframe');

      let selected = false;
      addEventListener('keydown', function(e) {
        if (e.key == 'Backspace') {
          if (selected) keyframe.remove();
        }
      });
      let keyframeClicked = false;
      let startClick = { x: 0, y: 0 };
      let oldTime = 0;
      let lastValidMovedSeconds = 0;
      keyframeDom.onmousedown = function(e) {
        if (e.path[0] != keyframeDom) return;
        e.preventDefault();
        keyframeClicked = true;
        startClick.x = e.clientX;
        startClick.y = e.clientY;
        oldTime = keyframe.snippetTime;
        document.body.style.cursor = 'move';
        keyframeDom.style.cursor = 'move';

        selected =  true;
        keyframeDom.classList.add('selected');
      }
      document.addEventListener('mousedown', function(e) {
        if (e.path[0] == keyframeDom) return;
        selected = false;
        keyframeDom.classList.remove('selected');
      });
      document.addEventListener('mouseup', function(e) {
        keyframeClicked = false;
        document.body.style.cursor = '';
        keyframeDom.style.cursor = 'pointer';
      });
      document.addEventListener('mousemove', function(e) {
        if (!keyframeClicked) return;
        let movedSeconds = (e.clientX - startClick.x) / TimeVisualizer.getPixelsPerSecond();
        // Don't move keyframe if we can't place it there.
        if (snippet.keyframeAtTime(oldTime + movedSeconds, keyframe)) {
          movedSeconds = lastValidMovedSeconds;
        }
        keyframe.move(Math.max(0, oldTime + movedSeconds));
        lastValidMovedSeconds = movedSeconds;
        update();
        snippet.snippetLine.update(false, true);
      });
      keyframeDom.ondblclick = function(e) {
        if (e.path[0] != keyframeDom) return;
        CodeEditor.editors[0].setValue(keyframe.hitCode);
        CodeEditor.editors[1].setValue(keyframe.tickCode);
        CodeEditor.editors[2].setValue(keyframe.endCode);
        CodeEditor.markSaved(0);
        CodeEditor.markSaved(1);
        CodeEditor.markSaved(2);
        const save = () => {
          snippet.deactivate();
          snippet.snippetLine.update(false, true);
        }
        CodeEditor.setSaveLocation(0, keyframe, 'hitCode', save);
        CodeEditor.setSaveLocation(1, keyframe, 'tickCode', save);
        CodeEditor.setSaveLocation(2, keyframe, 'endCode', save);

        CodeEditor.setHeaderText(0, 'hit(PIXI)');
        CodeEditor.setHeaderText(1, 'tick(PIXI, time, length, nodeTime)');
        CodeEditor.setHeaderText(2, 'end(PIXI)');

        const editing = document.getElementsByClassName('editing');
        for (let i = 0; i < editing.length; i++) {
          editing[i].classList.remove('editing');
        }

        keyframeDom.classList.add('editing');
      }
      snippet.dom.appendChild(keyframeDom);
    }

    update();
  }

  function update() {
    const timeStart = TimeVisualizer.getTimeStart();
    const pixelsPerSecond = TimeVisualizer.getPixelsPerSecond();

    for (let l = 0; l < timeline.snippetLines.length; l++) {
      const snippets = timeline.snippetLines[l].snippets;
      for (let s = 0; s < snippets.length; s++) {
        snippets[s].dom.style.left = (snippets[s].start - timeStart) * pixelsPerSecond
        snippets[s].dom.style.width = snippets[s].length * pixelsPerSecond;

        const keyframes = snippets[s].keyframes;
        for (let w = 0; w < keyframes.length; w++) {
          // Keyframes are 8 wide so try to center them
          keyframes[w].dom.style.left = keyframes[w].snippetTime * pixelsPerSecond - 5;
        }
      }
    }

    // Update playhead location
    playheadDom.style.left = (playheadTime - timeStart) * pixelsPerSecond;
  }

  function setPlayhead(time) {
    const timeStart = TimeVisualizer.getTimeStart();
    const pixelsPerSecond = TimeVisualizer.getPixelsPerSecond();

    playheadTime = time;
    playheadDom.style.left = (time - timeStart) * pixelsPerSecond;
  }

  TimeVisualizer.setRenderCallback(update);

  return {
    updateSnippetLines,
    addSnippet,
    setPlayhead,
    updateKeyframes
  }
}