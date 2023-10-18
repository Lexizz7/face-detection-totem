const video = document.getElementById("video");
const videoWrapper = document.getElementById("video-wrapper");
const alert = document.getElementById("alert");
let canvas = null;
let displaySize = null;

function positionAlert() {
  alert.style.top = `${video.offsetTop + video.clientHeight / 2}px`;
  alert.style.left = `${video.offsetLeft + video.clientWidth / 2}px`;
  alert.style.maxWidth = `${video.clientWidth}px`;
  alert.style.maxHeight = `${video.clientHeight}px`;
}

function resizeVideo() {
  const bounding = videoWrapper.getBoundingClientRect();
  video.style.width = `${bounding.width}px`;
  video.style.height = `${bounding.height}px`;
  video.style.top = `${bounding.y}px`;
  video.style.left = `${bounding.x}px`;
  positionAlert();
}

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => {
      alert.innerText = "Carregando o modelo de reconhecimento facial...";
      video.srcObject = stream;
    },
    (err) => console.error(err),
  );
}

function resizeCanvas() {
  const ratio = Math.min(
    video.clientWidth / video.videoWidth,
    video.clientHeight / video.videoHeight,
  );
  displaySize = {
    width: video.videoWidth * ratio,
    height: video.videoHeight * ratio,
  };
  canvas.style.top = `${video.offsetTop}px`;
  canvas.style.left = `${video.offsetLeft}px`;
  faceapi.matchDimensions(canvas, displaySize);
}

function init() {
  video.style.opacity = 1;
  canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  resizeCanvas();

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
    alert.style.opacity !== 0 && (alert.style.opacity = 0);
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
window.addEventListener("resize", () => {
  resizeVideo();
  resizeCanvas();
});

resizeVideo();
