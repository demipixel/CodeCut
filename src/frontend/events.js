
module.exports = function(timeline) {
  function togglePlayPause() {
    const button = document.getElementById('toggle-play-pause');
    if (timeline.playing) {
      timeline.pause();
      button.innerText = 'Play';
    } else {
      timeline.play();
      button.innerText = 'Pause';
    }
  }

  function newSnippetLine() {
    timeline.addLine();
  }

  function importFile(e) {
    const input = event.target;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      try {
        const obj = JSON.parse(reader.result);
        timeline.importObject(obj);
      } catch (e) {
        alert('There was an error importing that file!');
        console.error(e);
      }
    }
    reader.readAsText(input.files[0]);
  }

  window.addEventListener('keydown', function(e) {
    if (document.activeElement.tagName == 'TEXTAREA') return;
    if (e.code == 'Space') {
      e.preventDefault();
      togglePlayPause();
    }
  });

  return {
    togglePlayPause,
    newSnippetLine,
    importFile
  }
}