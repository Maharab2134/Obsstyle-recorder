let mediaRecorder;
let recordedChunks = [];
let startTime, timerInterval;
const previewVideo = document.getElementById('previewVideo');
const recIndicator = document.getElementById('recIndicator');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const stopBtn = document.getElementById('stopBtn');
const timerDisplay = document.getElementById('timerDisplay');

startBtn.onclick = async () => {
  const [width, height] = document.getElementById('resolution').value.split('x').map(Number);
  const fps = parseInt(document.getElementById('fps').value);

  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: { width, height, frameRate: fps },
    audio: true
  });
  const voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const combinedStream = new MediaStream([
    ...displayStream.getVideoTracks(),
    ...voiceStream.getAudioTracks()
  ]);

  previewVideo.srcObject = displayStream;

  mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
  mediaRecorder.onstop = saveFile;

  mediaRecorder.start(1000);
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
  recIndicator.style.display = 'block';

  startBtn.disabled = true;
  stopBtn.disabled = false;
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
};

pauseBtn.onclick = () => {
  mediaRecorder.pause();
  clearInterval(timerInterval);
  pauseBtn.disabled = true;
  resumeBtn.disabled = false;
};

resumeBtn.onclick = () => {
  mediaRecorder.resume();
  startTime = Date.now() - getElapsedSeconds() * 1000;
  timerInterval = setInterval(updateTimer, 1000);
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  clearInterval(timerInterval);
  resetUI();
  previewVideo.srcObject = null;
  recIndicator.style.display = 'none';
};

function updateTimer() {
  const elapsed = getElapsedSeconds();
  const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const sec = String(elapsed % 60).padStart(2, '0');
  timerDisplay.textContent = `${min}:${sec}`;
}

function getElapsedSeconds() {
  return Math.floor((Date.now() - startTime) / 1000);
}

function resetUI() {
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  stopBtn.disabled = true;
  timerDisplay.textContent = '00:00';
}

function saveFile() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recording.webm';
  a.click();
  URL.revokeObjectURL(url);
  recordedChunks = [];
}