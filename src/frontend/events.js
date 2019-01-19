
module.exports = function(timeline) {
  function togglePlayPause() {
    const button = document.getElementById('togglePlayPause');
    if (timeline.playing) {
      timeline.pause();
      button.innerText = 'Play';
    } else {
      timeline.play();
      button.innerText = 'Pause';
    }
  }

  return {
    togglePlayPause
  }
}