import {
  Dom,
  Effect,
  Image,
  ImageCapture,
  Module,
  Player,
  VideoRecorder,
  Webcam,
} from "https://cdn.jsdelivr.net/npm/@banuba/webar/dist/BanubaSDK.browser.esm.min.js";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const modulesList = [
  "background",
  "body",
  "eyes",
  "face_tracker",
  "hair",
  "hands",
  "lips",
  "skin",
];

// NOTE: desired width and height should be multiple of 4
const desiredWidth = 1120;
const desiredHeight = 524;

export const fps = {
  cam: 0,
  processing: 0,
  render: 0,
};

const fpsCounter = {
  cam: 0,
  processing: 0,
  render: 0,
}

let currentEffect;

const [player, modules] = await Promise.all([
  Player.create({
    clientToken: "mAlTUIsD8k2Mk6++d3i6YjRKfEC8pkAjGbiOTzWJ/2etg22PuRAuPGvUFLGBAPM/+NZcC1DlKbMHRHu6CQ7TavJnwbnQYKTaV+MtZKaLlyJen+kDeXyYvmjdiASe3+ywMUbsK5wT7JFRzlvNSl5DB0uz1UIfGa8I14ezwMKOzBByfmYuFiKoc13DLV3gFLYkALsuIfk488eVLoqruy+NMRVwe036FKb4GRTZoC2RqguwSrF73o7jBMdc8IJB8DP1gCw+vvBLkv7GlPtm6JCkqKpt5hQF2FVT5vqy489CiS4UdX/w7uMxOO0N8DKg0qozORrTXaT7+nMVhf7nY3bIJr9Im5XRiFpZOmhdi3mv02BpMWVelWCziU1YnrQgRB4bVu0crw68m2PmoN23fQcHKroj2oGHSYDpJxN6sadLfNg0inRN1wG+8POdPWthENaMYAGZ4bx7MvKhcNUGjlZxk4nNg0ln9N6twidKO5NjpgDXq1YsGiX2cC8vu7pZ6ARKATtfHJpwzVmvBZPniHPKRvjEdyhnaBIGesFVGjK4BWPYIoiL9Cr0rCPW3kbw4EFICaZtuXuatEeVXc3tDztNxkpIP8xDXI7sPARQW5MnjrbnWWN2ko92QMJZ6zCsK0s5Gw6Bsvc6V2u1hPsTxmcp94W7mZNeynxAVY5XxqIps8IMOkQpaVE3XBBOYXrYJ3TTfsv/SOr8otVYDI4IPON7MqtkK6+6EOcG80M2R+V1JQl1sf7nV8L8ZTJfjVZOwV1tWZR2HfBgjXDpFyaFt/2pSw4UuONynRummIOLLIJWmuFo87O2rxe4jOy+OAWurvkrY4fxFMIENImNMALvd9Mcrw+A1yFA9w0XMEI7SOB1nE9ZYgoac49lhzi4wNFtvT1QAED6BBhRqNFBOaLBoh16X0Ni1optige3WCXkHw192QNSe9QqG7lmDyckpub2clO+sHt44Y3707w4tcPqmBYsTTIg7HMIHeSP8uu3xBJw4+17zfn3x7xXQ0Xsl8W9nv1KfhQtGgeQbB0ubG2laJxuIvMI9MYZ/oc4qSokyoh9/OYcwqqlgBglW8Jfdm0mWquaF+8GisHktkiLlM2aVUZsMaITnSAGwQGMyj5meUt02ax/dkqA+DcJnCkZ0S9kPQrTTrpGfHZGZIm4tZfct0i8XQJsLNP+1EQWlQuhyvoA1ABIm2sAoCYou/CwrAMjQ5rAqf/NZL8qyzYmrryI64+rntJIcuOc6lqP58GuUaU6o7b6VgFRKwZTelJPTeurjzcJTO4kl70jyMEqZbk8TwfiGfkB0rjyb/6sKl5RFvv0NhAKtpo5D6yn9AOjYzDLijjEoxf2J9ysq7yfbah00TC2FsJJMugyWrK4fofMAcnJJW/Y/i6RV+Pmb6vCcr3kq5ovguduwicy1JPljXb23t0lfI5tXZeDfPEwQ2IZcWiATp29kTvXiZ6WRb48FsHUlQonAINRKs/6NbL5am31n7j9EYzpJ1H07kauoNNbWStSiv3ZXX1/zAP6JQa9qYpon2xDFPqgZLu8+LbGVIlZ2cup8QFpz5rJ9vsmmsDhY2TOkWBh0RMXgyjWygdhOJmBT6ayz7QTi6ImhXlTGk4PNi6cnHYz6eQJqMtsGVC8r/dUOrwR9qzP/5eg3Jhv0fW10hzuiOanuwchA0gk3pIoUI1s3zf8GC/PLFPsyALquy6/4T4t9v9xecx0TOV/AxrcgQ==",
    proxyVideoRequestsTo: isSafari ? "___range-requests___/" : null,
    useFutureInterpolate: false,
  }),
  Module.preload(
    modulesList.map((m) => {
      return isSafari && m === "face_tracker"
        ? `https://cdn.jsdelivr.net/npm/@banuba/webar/dist/modules/${m}_lite.zip`
        : `https://cdn.jsdelivr.net/npm/@banuba/webar/dist/modules/${m}.zip`;
    }),
  ),
]);
await player.addModule(...modules);

const crop = (renderWidth, renderHeight) => {
  const dx = (renderWidth - desiredWidth) / 2;
  const dy = (renderHeight - desiredHeight) / 2;

  return [dx, dy, desiredWidth, desiredHeight];
};

const startFpsTracking = () => {
  player.addEventListener("framereceived", () => fpsCounter.cam++);
  player.addEventListener(
    "frameprocessed",
    ({ detail }) => (fpsCounter.processing = 1000 / detail.averagedDuration),
  );
  player.addEventListener("framerendered", () => fpsCounter.render++);

  setInterval(() => {
    fps.cam = fpsCounter.cam
    fps.render = fpsCounter.render
    fps.processing = fpsCounter.processing
    fpsCounter.cam = 0
    fpsCounter.render = 0
  }, 1000)
};

let curResult;
let analyseFunc;
const renderAnalysisResultFuncs = {
  Detection_gestures: async (paramString, resultBlock) => {
    let res = await currentEffect.evalJs(paramString);
    if (curResult !== res && res !== undefined) {
      curResult = res;
      const icon =
        res !== "No Gesture"
          ? `<img src="assets/icons/hand_gestures/${curResult}.svg" alt="${curResult}"/>`
          : "";
      resultBlock.innerHTML = icon + `<span>${curResult}</span>`;
    }
  },

  heart_rate: async (paramString, resultBlock) => {
    let res = await currentEffect.evalJs(paramString);
    if (curResult !== res && res !== undefined) {
      curResult = res;
      if (curResult.includes("calculation")) {
        resultBlock.classList.add("heart-rate__analyse");
      } else {
        resultBlock.classList.remove("heart-rate__analyse");
      }
      resultBlock.innerText = curResult;
    }
  },

  test_Ruler: async (paramString, resultBlock) => {
    let res = await currentEffect.evalJs(paramString);
    if (curResult !== res && res !== undefined) {
      curResult = res;
      resultBlock.innerText = curResult;
    }
  },
};

/**
 * __analyticsState can be "enabled" or "disabled"
 */
const __analyticsActive = "active"
const __analyticsInActive = "inactive" 
let _analyticsState = __analyticsInActive

export const startAnalysis = async (effectName, paramString, resultBlock) => {
  analyseFunc = () =>
    renderAnalysisResultFuncs[effectName.split(".")[0]](
      paramString,
      resultBlock,
    );
  player.addEventListener("framedata", analyseFunc);
  _analyticsState = __analyticsActive
};

export const stopAnalysis = () => {
  if (_analyticsState === __analyticsActive) player.removeEventListener("framedata", analyseFunc);
  _analyticsState = __analyticsInActive
};

export const clearEffect = async () => {
  await player.clearEffect();
};

export const muteToggle = (value) => {
  player.setVolume(value);
};

export const getSource = (sourceType, file) => {
  return sourceType === "webcam" ? new Webcam() : new Image(file);
};

export const getPlayer = () => {
  return player;
};

export const startPlayer = (source) => {
  player.use(source, { crop });
  Dom.render(player, "#webar");
  startFpsTracking();
};

export const applyEffect = async (effectName) => {
  currentEffect = new Effect(effectName);
  await player.applyEffect(currentEffect);
};

export const applyEffectParam = async (paramString) => {
  await currentEffect.evalJs(paramString);
};

export const startGame = () => {
  currentEffect.evalJs("isButtonTouched").then((isButtonTouched) => {
    if (isButtonTouched === "false") {
      currentEffect.evalJs("onClick()");
    }
  });
};

export const getScreenshot = async () => {
  const capture = new ImageCapture(player);
  return await capture.takePhoto();
};

let recorder;
const getRecorder = () => {
  if (recorder) return recorder;

  recorder = new VideoRecorder(player);
  return recorder;
};

export const startRecord = () => {
  getRecorder().start();
};

export const stopRecord = async () => {
  return await getRecorder().stop();
};
