// Code to capture video and export it
/* globals MediaRecorder */
// Spec is at http://dvcs.w3.org/hg/dap/raw-file/tip/media-stream-capture/RecordingProposal.html

const Timeline = require('./Timeline')
let recording = false


let downloadLink = document.getElementById("downloadLink");
console.log(downloadLink)




// push data into chunks




// Create Downloadable obj after mediaRecorder Stops



// On button click or something
 function exportVid(FPS, time){
	const canvas = time.pixiApp.view
	const canvasRec = canvas.captureStream(0);
	const mediaRec = new MediaRecorder(canvasRec);
	let chunks = [];
	let frames = [];
	let count = 0;

	mediaRec.ondataavailable = function(e) {
		console.log('!!!!!!!' + e.data);	
		chunks.push(e.data);
	};

	let renderFrame = (t) => {
		if(recording){
			time.scrub(count/FPS);
			mediaRec.stream.getTracks()[0].requestFrame();
			count++;
		}

		if(count/FPS == 5){
			mediaRec.stop();
			return
		}

		console.log('requesting animation');
  requestAnimationFrame(renderFrame);

	}
 
	mediaRec.onstart = () =>{
		recording = true;
		renderFrame(0)
	}

	mediaRec.onstop = function(){
		recording = false
		console.log('Stopped  & state = ' + mediaRec.state);
					console.log(chunks);	
					var blob = new Blob(chunks, {type: "video/webm"});
					chunks = [];
	
					var videoURL = window.URL.createObjectURL(blob);
					console.log(videoURL);

					const a = document.createElement('a');
					a.style.display = 'none';
					a.text.fontcolor('yellow')
					a.href = videoURL;
					a.download = 'test.webm';
					document.body.appendChild(a);
					a.click();
					setTimeout(() => {
					  document.body.removeChild(a);
					  window.URL.revokeObjectURL(url);
					}, 100);
	
					// downloadLink.href = videoURL;
					// videoElement.src = videoURL;	
					// downloadLink.innerHTML = 'Download video file';
	
					// var rand =  Math.floor((Math.random() * 10000000));
					// var name  = "video_"+rand+".webm" ;
	
					// downloadLink.setAttribute( "download", name);
					// downloadLink.setAttribute( "name", name);
				
	};
	// find ending point
	let startTime = 0;
	let endTime = 20; // still need to figure out how to calculate endtime
	console.log(canvasRec);
	console.log(canvas);
	console.log(mediaRec);
	console.log(canvasRec.getVideoTracks()[0])
	console.log(mediaRec.stream);
	console.log(mediaRec.stream.getTracks());

	console.log('**')
	mediaRec.start();	
	// for(startTime; startTime <= endTime; startTime += (1.0/FPS)){
	// 	time.scrub(startTime);
	// 	mediaRec.stream.getTracks()[0].requestFrame();
	// 	mediaRec.requestData();
	// }
	//  mediaRec.stop();
}

module.exports = exportVid;