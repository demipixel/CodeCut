
module.exports = function(TimeVisualizer) {
  const playheadDom = document.getElementById('playhead');
  function addSnippetLines(timeline) {
    for (let s = 0; s < timeline.snippetLines.length; s++) {
      const line = document.createElement('div');
      line.classList.add('snippet-line');
      line.dataset.index = s.toString();
      document.getElementById('snippet-lines').appendChild(line);
    }
    update();
  }

  function addSnippet(lineIndex, snippetIndex, snippet) {
    const line = document.getElementsByClassName('snippet-line')[lineIndex];
    const snippetDom = document.createElement('div');
    snippetDom.classList.add('snippet');
    snippetDom.dataset.index = snippetIndex;
    addSnippetGrippers(snippetDom, snippet);
    let snippetClicked = false;
    let startClick = { x: 0, y: 0 };
    let oldStart = 0;
    let oldLength = 0;
    snippetDom.onmousedown = function(e) {
      if (e.path[0] != snippetDom) return;
      e.preventDefault();
      snippetClicked = true;
      startClick.x = e.clientX;
      startClick.y = e.clientY;
      oldStart = snippet.start;
      oldLength = snippet.length;
      document.body.style.cursor = 'move';
      snippetDom.style.cursor = 'move';
    }
    document.addEventListener('mouseup', function(e) {
      snippetClicked = false;
      document.body.style.cursor = '';
      snippetDom.style.cursor = 'pointer';
    });
    document.addEventListener('mousemove', function(e) {
      if (!snippetClicked) return;
      let movedSeconds = (e.clientX - startClick.x) / TimeVisualizer.getPixelsPerSecond();
      if (snippet.nextSnippet) {
        movedSeconds = Math.min(movedSeconds, )
      }
      snippet.start = Math.max(0, oldStart + movedSeconds);
      update();
      snippet.snippetLine.update(true);
    });
    line.appendChild(snippetDom);

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

  function update() {
    const timeStart = TimeVisualizer.getTimeStart();
    const pixelsPerSecond = TimeVisualizer.getPixelsPerSecond();

    const lines = document.getElementsByClassName('snippet-line');
    for (let l = 0; l < lines.length; l++) {
      const lineIndex = parseInt(lines[l].dataset.index);
      const snippets = lines[l].getElementsByClassName('snippet');
      for (let s = 0; s < snippets.length; s++) {
        const snippetIndex = parseInt(snippets[s].dataset.index);
        const timelineSnippet = timeline.snippetLines[lineIndex].snippets[snippetIndex];
        snippets[s].style.left = (timelineSnippet.start - timeStart) * pixelsPerSecond
        snippets[s].style.width = timelineSnippet.length * pixelsPerSecond;
      }
    }
  }

  function setPlayhead(time) {
    const timeStart = TimeVisualizer.getTimeStart();
    const pixelsPerSecond = TimeVisualizer.getPixelsPerSecond();

    playheadDom.style.left = (time - timeStart) * pixelsPerSecond;
  }

  TimeVisualizer.setRenderCallback(update);

  return {
    addSnippetLines,
    addSnippet,
    setPlayhead
  }
}