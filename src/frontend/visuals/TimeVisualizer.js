const MIN_PIXELS_PER_TICK = 20;
const IMPORT_PER_TICKS = 3;

module.exports = function() {
  const canvas = document.getElementById('time-visualizer-canvas');
  const ctx = canvas.getContext('2d');
  let zoomLevel = 2**-8; // One second = 1/(zoomLevel*2) pixels
  let timeStart = 0;

  let renderCb = null;
  document.getElementById('timeline').onwheel = function(e) {
    e.preventDefault();
    if (e.ctrlKey) {
      const x = e.deltaY / 15;
      let scalar = Math.exp(x) / (1  + Math.exp(x));
      scalar *= 2;
      zoomLevel *= scalar;
      zoomLevel = Math.min(Math.max(2**-11, zoomLevel), 10);
      timeStart = Math.max(timeStart, -(2**6) * zoomLevel);
    } else {
      timeStart += e.deltaX * zoomLevel * 1;
    }

    timeStart = Math.max(timeStart, -(2**6) * zoomLevel);
    render();
    renderCb();
  }

  let isScrubbing = false;
  canvas.onmousedown = function(e) {
    isScrubbing = true;
    const time = (e.clientX - canvas.clientLeft) / getPixelsPerSecond() + timeStart;
    timeline.scrub(time);
  }

  document.addEventListener('mouseup', function(e) {
    isScrubbing = false;
  });

  document.addEventListener('mousemove', function(e) {
    if (!isScrubbing) return;
    const time = (e.clientX - canvas.clientLeft) / getPixelsPerSecond() + timeStart;
    timeline.scrub(time);
  });

  window.addEventListener('resize', function() {
    render();
  });

  function render() {
    canvas.width = document.getElementById('timeline').clientWidth * 2;
    canvas.height = document.getElementById('time-visualizer').clientHeight * 2;
    canvas.style.width = canvas.width / 2;
    canvas.style.height = canvas.height / 2;

    let timeSize = 2**5;
    while (timeSize >= 2**-5 && timeSize / zoomLevel > MIN_PIXELS_PER_TICK) {
      timeSize /= 2;
    }
    timeSize *= 2;

    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTimeStart = timeStart - timeSize * 2;
    let curTime = Math.ceil(renderTimeStart/timeSize)*timeSize;
    let x = (((timeSize - (renderTimeStart % timeSize)) % timeSize) - timeSize*2) / zoomLevel;
    while (x < canvas.width + 30) {
      const important = curTime % (timeSize * 2**IMPORT_PER_TICKS) == 0;

      if (curTime >= 0) {
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x, canvas.height - (important ? 20 : 10));
        ctx.stroke();
        if (important) {
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ddd';
          ctx.fillText((curTime)+'s', x, canvas.height - 25);
        }
      }
      x += timeSize / zoomLevel;
      curTime += timeSize;
    }
  }

  render();

  function getPixelsPerSecond() {
    return 1 / (zoomLevel*2);
  }

  function getTimeStart() {
    return timeStart;
  }
  
  function setRenderCallback(cb) {
    renderCb = cb;
  }

  return {
    getPixelsPerSecond,
    getTimeStart,
    setRenderCallback
  };
}