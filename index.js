const video = document.getElementById("video");
const videoWrapper = document.getElementById("video-wrapper");
const loading = document.getElementById("loading");
let canvas = null;
let displaySize = null;

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => {
      loading.style.display = "flex";
      video.srcObject = stream;
    },
    (err) => console.error(err),
  );
}

function resize() {
  const ratio = Math.min(
    video.clientWidth / video.videoWidth,
    video.clientHeight / video.videoHeight,
  );
  displaySize = {
    width: video.videoWidth * ratio,
    height: video.videoHeight * ratio,
  };
  faceapi.matchDimensions(canvas, displaySize);
}

function init() {
  canvas = faceapi.createCanvasFromMedia(video);
  videoWrapper.append(canvas);
  resize();

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    // Flip the detections horizontally so that they are mirrored
    for (const detection of resizedDetections) {
      detection.detection._box._x =
        displaySize.width -
        detection.detection._box._x -
        detection.detection._box._width;
      for (const landmark of detection.landmarks._positions) {
        landmark._x = displaySize.width - landmark._x;
      }
    }
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    loading.style.display !== "none" && (loading.style.display = "none");
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  }, 100);
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
]).then(startVideo);

video.addEventListener("play", init);
window.addEventListener("resize", resize);
