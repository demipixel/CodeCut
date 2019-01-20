const Capture = require('./capture.js')
module.exports = function(timeline) {
  function togglePlayPause() {
    const button = document.getElementById('toggle-play-pause');
    if (timeline.playing) {
      timeline.pause();
      button.src = '/img/256-Play-01.png';
    } else {
      timeline.play();
      button.src = '/img/256-Pause-01.png';
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

  function exportFile(){
    Capture(100, timeline);
   
}
  
  document.addEventListener('keydown', function(e) {
    if (document.activeElement.tagName == 'TEXTAREA') return;
    if (e.code == 'Space') {
      e.preventDefault();
      togglePlayPause();
    }
  });

  document.onkeydown = function (e) {
    e = e || window.event;//Get event
    if (e.ctrlKey || e.metaKey) {
        var c = e.which || e.keyCode;//Get key code
        switch (c) {
            case 83://Block Ctrl+S
                e.preventDefault();     
                e.stopPropagation();
            break;
        }
    }
};

  return {
    togglePlayPause,
    newSnippetLine,
    importFile,
    exportFile
  }
}