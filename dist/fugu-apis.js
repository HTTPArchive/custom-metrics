// [fugu-apis]

const patterns = {
  'Absolute Orientation Sensor': {
    regEx: /new\s+AbsoluteOrientationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'AbsoluteOrientationSensor' in self)(),
    featureDetection: `(async () => 'AbsoluteOrientationSensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1900,
  },
  'Accelerometer': {
    regEx: /new\s+Accelerometer\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Accelerometer' in self)(),
    featureDetection: `(async () => 'Accelerometer' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1899,
  },
  'Add to Home Screen': {
    regEx: /["']beforeinstallprompt["']|\.onbeforeinstallprompt/g,
    where: 'JavaScript',
    supported: (async () => 'BeforeInstallPromptEvent' in self)(),
    featureDetection: `(async () => 'BeforeInstallPromptEvent' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent',
    blinkFeatureID: 1436,
  },
  'Ambient Light Sensor': {
    regEx: /new\s+AmbientLightSensor\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'AmbientLightSensor' in self)(),
    featureDetection: `(async () => 'AmbientLightSensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1901,
  },
  'Async Clipboard': {
    regEx: /navigator\.clipboard\.writeText\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'clipboard' in navigator && 'writeText' in navigator.clipboard)(),
    featureDetection: `(async () => 'clipboard' in navigator && 'writeText' in navigator.clipboard)()`,
    documentation: 'https://web.dev/async-clipboard/',
    blinkFeatureID: 2372,
  },
  'Async Clipboard (Images)': {
    regEx: /navigator\.clipboard\.write\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'clipboard' in navigator && 'write' in navigator.clipboard)(),
    featureDetection: `(async () => 'clipboard' in navigator && 'write' in navigator.clipboard)()`,
    documentation: 'https://web.dev/async-clipboard/',
    blinkFeatureID: 2370,
  },
  'Background Fetch': {
    regEx: /\.backgroundFetch\.fetch\s*\(["']/g,
    where: 'JavaScript',
    supported: (async () => 'BackgroundFetchManager' in self)(),
    featureDetection: `(async () => 'BackgroundFetchManager' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API',
    blinkFeatureID: 2549,
  },
  'Background Sync': {
    regEx: /\.sync\.register\s*\(["']/g,
    where: 'JavaScript',
    supported: (async () =>
      'serviceWorker' in navigator &&
      'sync' in
        ((await navigator.serviceWorker?.ready) || self.registration))(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'sync' in (await navigator.serviceWorker?.ready || self.registration))()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API',
    blinkFeatureID: 745,
  },
  'Badging': {
    regEx: /navigator\.setAppBadge\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'setAppBadge' in navigator)(),
    featureDetection: `(async () => 'setAppBadge' in navigator)()`,
    documentation: 'https://web.dev/badging-api/',
    blinkFeatureID: 2726,
  },
  'Cache Storage': {
    regEx: /caches\.open\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'serviceWorker' in navigator && 'caches' in self)(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'caches' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage',
    blinkFeatureID: 3022,
  },
  'Compression Streams': {
    regEx: /new\s+CompressionStream\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'CompressionStream' in self)(),
    featureDetection: `(async () => 'CompressionStream' in self)()`,
    documentation: 'https://wicg.github.io/compression/',
    blinkFeatureID: 3060,
  },
  'Compute Pressure': {
    regEx: /new\s+ComputePressureObserver\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'ComputePressureObserver' in self)(),
    featureDetection: `(async () => 'ComputePressureObserver' in self)()`,
    documentation: 'https://web.dev/compute-pressure/',
    blinkFeatureID: 3899,
  },
  'Contact Picker': {
    regEx: /navigator\.contacts\.select\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'contacts' in navigator)(),
    featureDetection: `(async () => 'contacts' in navigator)()`,
    documentation: 'https://web.dev/contact-picker/',
    blinkFeatureID: 2993,
  },
  'Content Index': {
    regEx: /index\.getAll\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'serviceWorker' in navigator &&
      'index' in
        ((await navigator.serviceWorker?.ready) || self.registration))(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'index' in (await navigator.serviceWorker?.ready || self.registration))()`,
    documentation: 'https://web.dev/content-indexing-api/',
    blinkFeatureID: 2985,
  },
  'Credential Management': {
    regEx: /navigator\.credentials\.get\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'credentials' in navigator)(),
    featureDetection: `(async () => 'credentials' in navigator)()`,
    documentation:
      'https://developers.google.com/web/updates/2016/04/credential-management-api',
    blinkFeatureID: 960,
  },
  'Device Memory': {
    regEx: /navigator\.deviceMemory/g,
    where: 'JavaScript',
    supported: (async () => 'deviceMemory' in navigator)(),
    featureDetection: `(async () => 'deviceMemory' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Device_Memory_API',
    blinkFeatureID: 2121,
  },
  'Device Posture': {
    regEx: /navigator\.devicePosture/g,
    where: 'JavaScript',
    supported: (async () => 'devicePosture' in navigator)(),
    featureDetection: `(async () => 'devicePosture' in navigator)()`,
    documentation:
      'https://github.com/w3c/device-posture/blob/gh-pages/README.md',
    blinkFeatureID: undefined,
  },
  'Digital Goods': {
    regEx: /getDigitalGoodsService\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getDigitalGoodsService' in self)(),
    featureDetection: `(async () => 'getDigitalGoodsService' in self)()`,
    documentation:
      'https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing/',
    blinkFeatureID: 3397,
  },
  'EyeDropper': {
    regEx: /new\s+EyeDropper\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'EyeDropper' in self)(),
    featureDetection: `(async () => 'EyeDropper' in self)()`,
    documentation: 'https://web.dev/eyedropper/',
    blinkFeatureID: undefined,
  },
  'File Handling': {
    regEx: /"file_handlers"/g,
    where: 'Web App Manifest',
    supported: (async () =>
      'launchQueue' in self && 'files' in LaunchParams.prototype)(),
    featureDetection: `(async () => 'launchQueue' in self && 'files' in LaunchParams.prototype)()`,
    documentation: 'https://web.dev/file-handling/',
    blinkFeatureID: 3875,
  },
  'File System Access': {
    regEx:
      /showOpenFilePicker\s*\(|showSaveFilePicker\s*\(|showDirectoryPicker\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'showOpenFilePicker' in self)(),
    featureDetection: `(async () => 'showOpenFilePicker' in self)()`,
    documentation: 'https://web.dev/file-system-access/',
    blinkFeatureID: 3340,
  },
  'Origin Private File System': {
    regEx: /navigator\.storage\.getDirectory\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'getDirectory' in StorageManager.prototype)(),
    featureDetection: `(async () => 'getDirectory' in StorageManager.prototype)()`,
    documentation:
      'https://developer.chrome.com/articles/file-system-access/#accessing-the-origin-private-file-system',
    blinkFeatureID: 3428,
  },
  'Gamepad': {
    regEx: /navigator\.getGamepads\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getGamepads' in navigator)(),
    featureDetection: `(async () => 'getGamepads' in navigator)()`,
    documentation: 'https://web.dev/gamepad/',
    blinkFeatureID: 1916,
  },
  'getInstalledRelatedApps': {
    regEx: /navigator\.getInstalledRelatedApps\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getInstalledRelatedApps' in navigator)(),
    featureDetection: `(async () => 'getInstalledRelatedApps' in navigator)()`,
    documentation: 'https://web.dev/get-installed-related-apps/',
    blinkFeatureID: 1870,
  },
  'Gravity Sensor': {
    regEx: /new\s+GravitySensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'GravitySensor' in self)(),
    featureDetection: `(async () => 'GravitySensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 3795,
  },
  'Gyroscope': {
    regEx: /new\s+Gyroscope\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Gyroscope' in self)(),
    featureDetection: `(async () => 'Gyroscope' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1906,
  },
  'Handwriting Recognition': {
    regEx: /navigator\.queryHandwritingRecognizerSupport\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'queryHandwritingRecognizerSupport' in navigator)(),
    featureDetection: `(async () => 'queryHandwritingRecognizerSupport' in navigator)()`,
    documentation: 'https://web.dev/handwriting-recognition/',
    blinkFeatureID: 3893,
  },
  'HapticsDevice': {
    regEx: /\.haptics\.play\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'HapticsDevice' in self)(),
    featureDetection: `(async () => 'HapticsDevice' in self)()`,
    documentation:
      'https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/HapticsDevice/explainer.md',
    blinkFeatureID: undefined,
  },
  'Idle Detection': {
    regEx: /new\s+IdleDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'IdleDetector' in self)(),
    featureDetection: `(async () => 'IdleDetector' in self)()`,
    documentation: 'https://web.dev/idle-detection/',
    blinkFeatureID: 2834,
  },
  'Ink': {
    regEx: /navigator\.ink\.requestPresenter\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'ink' in navigator)(),
    featureDetection: `(async () => 'ink' in navigator)()`,
    documentation:
      'https://blogs.windows.com/msedgedev/2021/08/18/enhancing-inking-on-the-web/',
    blinkFeatureID: undefined,
  },
  'Insertable streams for MediaStreamTrack': {
    regEx: /MediaStreamTrackProcessor\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'MediaStreamTrackProcessor' in self &&
      'MediaStreamTrackGenerator' in self)(),
    featureDetection: `(async () => 'MediaStreamTrackProcessor' in self && 'MediaStreamTrackGenerator' in self)()`,
    documentation:
      'https://web.dev/mediastreamtrack-insertable-media-processing/',
    blinkFeatureID: 3729,
  },
  'Launch Handler': {
    regEx: /"launch_handler"/g,
    where: 'Web App Manifest',
    supported: (async () =>
      'launchQueue' in self && 'targetURL' in LaunchParams.prototype)(),
    featureDetection: `(async () => 'launchQueue' in self && 'targetURL' in LaunchParams.prototype)()`,
    documentation: 'https://web.dev/launch-handler/',
    blinkFeatureID: undefined,
  },
  'Linear Acceleration Sensor': {
    regEx: /new\s+LinearAccelerationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'LinearAccelerationSensor' in self)(),
    featureDetection: `(async () => 'LinearAccelerationSensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 2051,
  },
  'Local Font Access': {
    regEx: /queryLocalFonts\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'queryLocalFonts' in self)(),
    featureDetection: `(async () => 'queryLocalFonts' in self)()`,
    documentation: 'https://web.dev/local-fonts/',
    blinkFeatureID: 4211,
  },
  'Magnetometer': {
    regEx: /new\s+Magnetometer\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Magnetometer' in self)(),
    featureDetection: `(async () => 'Magnetometer' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1907,
  },
  'Media Capabilities': {
    regEx: /navigator\.mediaCapabilities\.decodingInfo\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'mediaCapabilities' in navigator)(),
    featureDetection: `(async () => 'mediaCapabilities' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Media_Capabilities_API',
    blinkFeatureID: 2239,
  },
  'Media Session': {
    regEx:
      /navigator\.mediaSession\.setActionHandler|navigator\.mediaSession\.metadata/g,
    where: 'JavaScript',
    supported: (async () => 'mediaSession' in navigator)(),
    featureDetection: `(async () => 'mediaSession' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API',
    blinkFeatureID: 1792,
  },
  'Multi-Screen Window Placement': {
    regEx: /getScreens\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'getScreens' in self)(),
    featureDetection: `(async () => 'getScreens' in self)()`,
    documentation: 'https://web.dev/multi-screen-window-placement/',
    blinkFeatureID: 3388,
  },
  'Navigation Preload': {
    regEx: /\.navigationPreload\.enable\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () =>
      'serviceWorker' in navigator &&
      'navigationPreload' in
        ((await navigator.serviceWorker?.ready) || self.registration))(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'navigationPreload' in (await navigator.serviceWorker?.ready || self.registration))()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/NavigationPreloadManager',
    blinkFeatureID: 1803,
  },
  'Payment Handler': {
    regEx: /\.paymentManager\.instruments\.set\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'PaymentInstruments' in self)(),
    featureDetection: `(async () => 'PaymentInstruments' in self)()`,
    documentation: 'https://web.dev/registering-a-web-based-payment-app/',
    blinkFeatureID: 2397,
  },
  'Payment Request': {
    regEx: /new\s+PaymentRequest\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'PaymentRequest' in self)(),
    featureDetection: `(async () => 'PaymentRequest' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API',
    blinkFeatureID: 2894,
  },
  'Periodic Background Sync': {
    regEx: /periodicSync\.register\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'PeriodicSyncManager' in self)(),
    featureDetection: `(async () => 'PeriodicSyncManager' in self)()`,
    documentation: 'https://web.dev/periodic-background-sync/',
    blinkFeatureID: 2931,
  },
  'Persistent Storage': {
    regEx: /navigator\.storage\.persist\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () =>
      'storage' in navigator && 'persist' in navigator.storage)(),
    featureDetection: `(async () => 'storage' in navigator && 'persist' in navigator.storage)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist',
    blinkFeatureID: 1369,
  },
  'Pointer Lock (unadjustedMovement)': {
    regEx: /unadjustedMovement\s*\:\s*/g,
    where: 'JavaScript',
    supported: (async () =>
      'HTMLParagraphElement' in self
        ? await (async () => {
            try {
              return !!(await document
                .createElement('p')
                .requestPointerLock({ unadjustedMovement: true }));
            } catch {
              return 'requestPointerLock' in HTMLParagraphElement.prototype;
            }
          })()
        : undefined)(),
    featureDetection: `(async () => 'HTMLParagraphElement' in self ? await (async () => { try { return !!await document.createElement("p").requestPointerLock({ unadjustedMovement: true }) } catch { return 'requestPointerLock' in HTMLParagraphElement.prototype } })() : undefined)()`,
    documentation: 'https://web.dev/disable-mouse-acceleration/',
    blinkFeatureID: 3027,
  },
  'Protocol Handlers': {
    regEx: /"protocol_handlers"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/url-protocol-handler/',
    blinkFeatureID: 3884,
  },
  'Push': {
    regEx: /\.pushManager\.subscribe\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'serviceWorker' in navigator &&
      'pushManager' in
        ((await navigator.serviceWorker?.ready) || self.registration))(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'pushManager' in (await navigator.serviceWorker?.ready || self.registration))()`,
    documentation: 'https://developer.mozilla.org/en-US/docs/Web/API/Push_API',
    blinkFeatureID: 769,
  },
  'Relative Orientation Sensor': {
    regEx: /new\s+RelativeOrientationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'RelativeOrientationSensor' in self)(),
    featureDetection: `(async () => 'RelativeOrientationSensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 2019,
  },
  'Screen Wake Lock': {
    regEx: /navigator\.wakeLock\.request\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'wakeLock' in navigator)(),
    featureDetection: `(async () => 'wakeLock' in navigator)()`,
    documentation: 'https://web.dev/wake-lock/',
    blinkFeatureID: 3005,
  },
  'Service Worker': {
    regEx: /navigator\.serviceWorker\.register\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'serviceWorker' in navigator)(),
    featureDetection: `(async () => 'serviceWorker' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API',
    blinkFeatureID: 990,
  },
  'Shape Detection (Barcodes)': {
    regEx: /new\s+BarcodeDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'BarcodeDetector' in self)(),
    featureDetection: `(async () => 'BarcodeDetector' in self)()`,
    documentation: 'https://web.dev/shape-detection/',
    blinkFeatureID: 3711,
  },
  'Shape Detection (Faces)': {
    regEx: /new\s+FaceDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'FaceDetector' in self)(),
    featureDetection: `(async () => 'FaceDetector' in self)()`,
    documentation: 'https://web.dev/shape-detection/',
    blinkFeatureID: 3712,
  },
  'Shape Detection (Texts)': {
    regEx: /new\s+TextDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'TextDetector' in self)(),
    featureDetection: `(async () => 'TextDetector' in self)()`,
    documentation: 'https://web.dev/shape-detection/',
    blinkFeatureID: 3713,
  },
  'Shortcuts': {
    regEx: /"shortcuts"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/app-shortcuts/',
    blinkFeatureID: undefined,
  },
  'Storage Estimation': {
    regEx: /navigator\.storage\.estimate\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () =>
      'storage' in navigator && 'estimate' in navigator.storage)(),
    featureDetection: `(async () => 'storage' in navigator && 'estimate' in navigator.storage)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate',
    blinkFeatureID: 1371,
  },
  'Tabbed Application Mode': {
    regEx: /"tabbed"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/tabbed-application-mode/',
    blinkFeatureID: undefined,
  },
  'VirtualKeyboard': {
    regEx: /navigator\.virtualKeyboard/g,
    where: 'JavaScript',
    supported: (async () => 'virtualKeyboard' in navigator)(),
    featureDetection: `(async () => 'virtualKeyboard' in navigator)()`,
    documentation:
      'https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/VirtualKeyboardAPI/explainer.md',
    blinkFeatureID: undefined,
  },
  'Web App Link Handling': {
    regEx: /"handle_links"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation:
      'https://github.com/WICG/pwa-url-handler/blob/main/handle_links/explainer.md',
    blinkFeatureID: undefined,
  },
  'Web Share': {
    regEx: /navigator\.share\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'share' in navigator)(),
    featureDetection: `(async () => 'share' in navigator)()`,
    documentation: 'https://web.dev/web-share/',
    blinkFeatureID: 1501,
  },
  'Web Share (Files)': {
    regEx: /navigator\.canShare\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'canShare' in navigator)(),
    featureDetection: `(async () => 'canShare' in navigator)()`,
    documentation: 'https://web.dev/web-share/',
    blinkFeatureID: 2737,
  },
  'Web Share Target': {
    regEx: /"share_target"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/web-share-target/',
    blinkFeatureID: undefined,
  },
  'Web Share Target (Files)': {
    regEx: /"enctype"\s*\:\s*"multipart\/form\-data"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/web-share-target/',
    blinkFeatureID: undefined,
  },
  'WebBluetooth': {
    regEx: /navigator\.bluetooth\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'bluetooth' in navigator)(),
    featureDetection: `(async () => 'bluetooth' in navigator)()`,
    documentation: 'https://web.dev/bluetooth/',
    blinkFeatureID: 1670,
  },
  'WebCodecs': {
    regEx: /new\s+MediaStreamTrackProcessor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'MediaStreamTrackProcessor' in self)(),
    featureDetection: `(async () => 'MediaStreamTrackProcessor' in self)()`,
    documentation: 'https://web.dev/webcodecs/',
    blinkFeatureID: 3728,
  },
  'WebGPU': {
    regEx: /navigator\.gpu\.requestAdapter\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'gpu' in navigator)(),
    featureDetection: `(async () => 'gpu' in navigator)()`,
    documentation: 'https://web.dev/webgpu',
    blinkFeatureID: 3888,
  },
  'WebHID': {
    regEx: /navigator\.hid\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'hid' in navigator)(),
    featureDetection: `(async () => 'hid' in navigator)()`,
    documentation: 'https://web.dev/hid/',
    blinkFeatureID: 2866,
  },
  'WebMIDI': {
    regEx: /navigator\.requestMIDIAccess\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'requestMIDIAccess' in navigator)(),
    featureDetection: `(async () => 'requestMIDIAccess' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API',
    blinkFeatureID: 2029,
  },
  'WebNFC': {
    regEx: /new\s+NDEFReader\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'NDEFReader' in self)(),
    featureDetection: `(async () => 'NDEFReader' in self)()`,
    documentation: 'https://web.dev/nfc/',
    blinkFeatureID: 3094,
  },
  'WebOTP': {
    regEx: /transport\s*\:\s*\[["']sms["']\]/g,
    where: 'JavaScript',
    supported: (async () => 'OTPCredential' in self)(),
    featureDetection: `(async () => 'OTPCredential' in self)()`,
    documentation: 'https://web.dev/web-otp/',
    blinkFeatureID: 2880,
  },
  'WebSerial': {
    regEx: /navigator\.serial\.requestPort\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'serial' in navigator)(),
    featureDetection: `(async () => 'serial' in navigator)()`,
    documentation: 'https://web.dev/serial/',
    blinkFeatureID: 2546,
  },
  'WebSocketStream': {
    regEx: /new\s+WebSocketStream\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'WebSocketStream' in self)(),
    featureDetection: `(async () => 'WebSocketStream' in self)()`,
    documentation: 'https://web.dev/websocketstream/',
    blinkFeatureID: 3018,
  },
  'WebTransport': {
    regEx: /new\s+WebTransport\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'WebTransport' in self)(),
    featureDetection: `(async () => 'WebTransport' in self)()`,
    documentation: 'https://web.dev/webtransport/',
    blinkFeatureID: 3472,
  },
  'WebUSB': {
    regEx: /navigator\.usb\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'usb' in navigator)(),
    featureDetection: `(async () => 'usb' in navigator)()`,
    documentation: 'https://web.dev/usb/',
    blinkFeatureID: 1520,
  },
  'Window Controls Overlay': {
    regEx: /"window\-controls\-overlay"/g,
    where: 'Web App Manifest',
    supported: (async () => 'windowControlsOverlay' in navigator)(),
    featureDetection: `(async () => 'windowControlsOverlay' in navigator)()`,
    documentation: 'https://web.dev/window-controls-overlay/',
    blinkFeatureID: 3902,
  },
};

const responseBodies = $WPT_BODIES;

// To avoid to match on, e.g., blog posts that contain the patterns,
// ensure that the file names fulfill certain conditions as a heuristic.
// Note that this leaves a slight risk of excluding inline `<script>` elements
// using these APIs from being covered, but usage there is expected to be small
// and we prefer to avoid the risk of false positives.
const checkURLConditions = (where, url, mimeType, responseBody) => {
  // If the pattern has to occur in JavaScript, make sure the file name
  // includes either `.js` or `.mjs` and uses a correct-ish MIME type
  // (https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#textjavascript).
  if (
    where === "JavaScript" &&
    /.m?js/.test(url) &&
    mimeType.toLowerCase().endsWith("script")
  ) {
    return true;
  }
  // If the pattern has to occur in the Web App Manifest, make sure the file
  // name includes either `.json` or `.webmanifest`, uses a MIME type that
  // ends in "json"
  // (https://w3c.github.io/manifest/#:~:text=file%20extension%3A%20.webmanifest%20or%20.json%3F),
  // and includes at least `"start_url"`.
  if (
    where === "Web App Manifest" &&
    /\.webmanifest|\.json/.test(url) &&
    mimeType.toLowerCase().endsWith("json") &&
    /"start_url"/.test(responseBody)
  ) {
    return true;
  }
  // Fall-through in all other cases.
  return false;
};

// Iterate over all response bodies and over all patterns and populate the
// result object.
const result = {};
responseBodies.forEach((har) => {
  for (const [key, value] of Object.entries(patterns)) {
    if (value.regEx.test(har.response_body)) {
      // Ignore the optional encoding, e.g.,
      // `application/manifest+json; charset=utf-8`.
      const mimeType = har.response_headers["content-type"]
        .split(";")[0]
        .trim();
      if (result[key] && !result[key].includes(har.url)) {
        if (checkURLConditions(value.where, har.url, mimeType, har.response_body)) {
          result[key].push(har.url);
        }
      } else {
        if (checkURLConditions(value.where, har.url, mimeType, har.response_body)) {
          result[key] = [har.url];
        }
      }
    }
  }
});

return result;
