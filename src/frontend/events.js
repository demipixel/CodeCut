
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

  window.addEventListener('keydown', function(e) {
    if (document.activeElement.tagName == 'TEXTAREA') return;
    if (e.code == 'Space') {
      e.preventDefault();
      togglePlayPause();
    }
  });

  return {
    togglePlayPause,
    newSnippetLine
  }
}