
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

  window.addEventListener('keydown', function(e) {
    if (e.code == 'Space') {
      e.preventDefault();
      togglePlayPause();
    }
  });

  return {
    togglePlayPause
  }
}