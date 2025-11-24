const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

const timezones = [
  'Asia/Shanghai',
  'Asia/Beijing',
  'Asia/Chongqing',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Seoul',
  'UTC',
  'Europe/London',
  'America/New_York',
];

const languages = [
  'zh-CN',
  'zh-Hans',
  'en-US',
  'en-GB',
  'ja-JP',
  'ko-KR',
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCanvasFingerprint() {
  const canvas = {
    r: randomBetween(0, 255),
    g: randomBetween(0, 255),
    b: randomBetween(0, 255),
    alpha: Math.random().toFixed(2),
  };
  return canvas;
}

function generateWebGLFingerprint() {
  const vendors = ['AMD', 'NVIDIA', 'Intel', 'Apple'];
  const renderers = ['Radeon RX 6700', 'GeForce RTX 3080', 'Intel Iris', 'Apple M1'];
  
  return {
    vendor: randomElement(vendors),
    renderer: randomElement(renderers),
  };
}

export function generateFingerprint() {
  return {
    userAgent: randomElement(userAgents),
    timezone: randomElement(timezones),
    language: randomElement(languages),
    screenWidth: randomElement([1920, 1366, 1440, 1600, 2560]),
    screenHeight: randomElement([1080, 768, 900, 1024, 1440]),
    devicePixelRatio: randomElement([1, 1.25, 1.5, 2]),
    canvas: generateCanvasFingerprint(),
    webgl: generateWebGLFingerprint(),
    plugins: randomBetween(0, 3),
    doNotTrack: randomElement(['1', null]),
    timezoneOffset: randomBetween(-720, 720),
  };
}

export function getFingerPrintScript(fingerprint) {
  return `
    Object.defineProperty(navigator, 'userAgent', {
      get: () => '${fingerprint.userAgent}'
    });

    Object.defineProperty(navigator, 'language', {
      get: () => '${fingerprint.language}'
    });

    Object.defineProperty(navigator, 'languages', {
      get: () => ['${fingerprint.language}']
    });

    Object.defineProperty(navigator, 'plugins', {
      get: () => new Array(${fingerprint.plugins})
    });

    Object.defineProperty(screen, 'width', {
      get: () => ${fingerprint.screenWidth}
    });

    Object.defineProperty(screen, 'height', {
      get: () => ${fingerprint.screenHeight}
    });

    Object.defineProperty(screen, 'availWidth', {
      get: () => ${fingerprint.screenWidth}
    });

    Object.defineProperty(screen, 'availHeight', {
      get: () => ${fingerprint.screenHeight - 40}
    });

    Object.defineProperty(screen, 'devicePixelRatio', {
      get: () => ${fingerprint.devicePixelRatio}
    });

    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      if (Math.random() > 0.9) {
        const ctx = this.getContext('2d');
        ctx.fillStyle = 'rgb(${fingerprint.canvas.r}, ${fingerprint.canvas.g}, ${fingerprint.canvas.b})';
        ctx.fillRect(0, 0, 10, 10);
      }
      return originalToDataURL.apply(this, args);
    };

    Object.defineProperty(Date.prototype, 'getTimezoneOffset', {
      value: function() {
        return ${fingerprint.timezoneOffset};
      }
    });
  `;
}
