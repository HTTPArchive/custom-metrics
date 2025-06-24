// [fugu-apis]

const patterns = {
  'Absolute Orientation Sensor': {
    regEx: /\bnew\s+AbsoluteOrientationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'AbsoluteOrientationSensor' in self)(),
    featureDetection: `(async () => 'AbsoluteOrientationSensor' in self)()`,
    documentation: 'https://developer.chrome.com/articles/generic-sensor/',
    blinkFeatureID: 1900,
    chromeStatusID: 5698781827825664,
  },
  'Accelerometer': {
    regEx: /\bnew\s+Accelerometer\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Accelerometer' in self)(),
    featureDetection: `(async () => 'Accelerometer' in self)()`,
    documentation: 'https://developer.chrome.com/articles/generic-sensor/',
    blinkFeatureID: 1899,
    chromeStatusID: 5698781827825664,
  },
  'Add to Home Screen': {
    regEx: /["']beforeinstallprompt["']|\.onbeforeinstallprompt/g,
    where: 'JavaScript',
    supported: (async () => 'BeforeInstallPromptEvent' in self)(),
    featureDetection: `(async () => 'BeforeInstallPromptEvent' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent',
    blinkFeatureID: 1436,
    chromeStatusID: 6560913322672128,
  },
  'Ambient Light Sensor': {
    regEx: /\bnew\s+AmbientLightSensor\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'AmbientLightSensor' in self)(),
    featureDetection: `(async () => 'AmbientLightSensor' in self)()`,
    documentation: 'https://developer.chrome.com/articles/generic-sensor/',
    blinkFeatureID: 1901,
    chromeStatusID: 5298357018820608,
  },
  'Async Clipboard': {
    regEx: /\bnavigator\.clipboard\.writeText\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'clipboard' in navigator && 'writeText' in navigator.clipboard)(),
    featureDetection: `(async () => 'clipboard' in navigator && 'writeText' in navigator.clipboard)()`,
    documentation: 'https://web.dev/async-clipboard/',
    blinkFeatureID: 2372,
    chromeStatusID: 5861289330999296,
  },
  'Async Clipboard (Images)': {
    regEx: /\bnavigator\.clipboard\.write\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'clipboard' in navigator && 'write' in navigator.clipboard)(),
    featureDetection: `(async () => 'clipboard' in navigator && 'write' in navigator.clipboard)()`,
    documentation: 'https://web.dev/async-clipboard/',
    blinkFeatureID: 2370,
    chromeStatusID: 5074658793619456,
  },
  'Background Fetch': {
    regEx: /\.backgroundFetch\.fetch\s*\(["']/g,
    where: 'JavaScript',
    supported: (async () => 'BackgroundFetchManager' in self)(),
    featureDetection: `(async () => 'BackgroundFetchManager' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API',
    blinkFeatureID: 2549,
    chromeStatusID: 5712608971718656,
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
    chromeStatusID: 6170807885627392,
  },
  'Badging': {
    regEx: /\bnavigator\.setAppBadge\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'setAppBadge' in navigator)(),
    featureDetection: `(async () => 'setAppBadge' in navigator)()`,
    documentation: 'https://developer.chrome.com/articles/badging-api/',
    blinkFeatureID: 2726,
    chromeStatusID: 6068482055602176,
  },
  'Cache Storage': {
    regEx: /\bcaches\.open\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'serviceWorker' in navigator && 'caches' in self)(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'caches' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage',
    blinkFeatureID: 3022,
    chromeStatusID: 6461631328419840,
  },
  'Compression Streams': {
    regEx: /\bnew\s+CompressionStream\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'CompressionStream' in self)(),
    featureDetection: `(async () => 'CompressionStream' in self)()`,
    documentation: 'https://developer.chrome.com/blog/compression-streams-api/',
    blinkFeatureID: 3060,
    chromeStatusID: 5855937971617792,
  },
  'Compute Pressure': {
    regEx: /\bnew\s+ComputePressureObserver\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'ComputePressureObserver' in self)(),
    featureDetection: `(async () => 'ComputePressureObserver' in self)()`,
    documentation:
      'https://developer.chrome.com/docs/web-platform/compute-pressure/',
    blinkFeatureID: 3899,
    chromeStatusID: 5597608644968448,
  },
  'Contact Picker': {
    regEx: /\bnavigator\.contacts\.select\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'contacts' in navigator)(),
    featureDetection: `(async () => 'contacts' in navigator)()`,
    documentation: 'https://developer.chrome.com/articles/contact-picker/',
    blinkFeatureID: 2993,
    chromeStatusID: 6511327140904960,
  },
  'Content Index': {
    regEx: /\bindex\.getAll\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'serviceWorker' in navigator &&
      'index' in
        ((await navigator.serviceWorker?.ready) || self.registration))(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'index' in (await navigator.serviceWorker?.ready || self.registration))()`,
    documentation:
      'https://developer.chrome.com/articles/content-indexing-api/',
    blinkFeatureID: 2985,
    chromeStatusID: 5658416729030656,
  },
  'Credential Management': {
    regEx: /\bnavigator\.credentials\.get\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'credentials' in navigator)(),
    featureDetection: `(async () => 'credentials' in navigator)()`,
    documentation:
      'https://developers.google.com/web/updates/2016/04/credential-management-api',
    blinkFeatureID: 960,
    chromeStatusID: 5026422640869376,
  },
  'Device Memory': {
    regEx: /\bnavigator\.deviceMemory/g,
    where: 'JavaScript',
    supported: (async () => 'deviceMemory' in navigator)(),
    featureDetection: `(async () => 'deviceMemory' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Device_Memory_API',
    blinkFeatureID: 2121,
    chromeStatusID: 5119701235531776,
  },
  'Device Posture': {
    regEx: /\bnavigator\.devicePosture/g,
    where: 'JavaScript',
    supported: (async () => 'devicePosture' in navigator)(),
    featureDetection: `(async () => 'devicePosture' in navigator)()`,
    documentation:
      'https://github.com/w3c/device-posture/blob/gh-pages/README.md',
    blinkFeatureID: 4880,
    chromeStatusID: 5185813744975872,
  },
  'Digital Goods': {
    regEx: /\bgetDigitalGoodsService\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getDigitalGoodsService' in self)(),
    featureDetection: `(async () => 'getDigitalGoodsService' in self)()`,
    documentation:
      'https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing/',
    blinkFeatureID: 3397,
    chromeStatusID: 5339955595313152,
  },
  'EyeDropper': {
    regEx: /\bnew\s+EyeDropper\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'EyeDropper' in self)(),
    featureDetection: `(async () => 'EyeDropper' in self)()`,
    documentation: 'https://developer.chrome.com/articles/eyedropper/',
    blinkFeatureID: 5042,
    chromeStatusID: 6304275594477568,
  },
  'File Handling': {
    regEx: /"file_handlers"/g,
    where: 'Web App Manifest',
    supported: (async () =>
      'launchQueue' in self && 'files' in LaunchParams.prototype)(),
    featureDetection: `(async () => 'launchQueue' in self && 'files' in LaunchParams.prototype)()`,
    documentation: 'https://developer.chrome.com/articles/file-handling/',
    blinkFeatureID: 3875,
    chromeStatusID: 5721776357113856,
  },
  'File System Observer': {
    regEx: /\bnew\s+FileSystemObserver\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'FileSystemObserver' in self)(),
    featureDetection: `(async () => 'FileSystemObserver' in self)()`,
    documentation:
      'https://github.com/whatwg/fs/blob/main/proposals/FileSystemObserver.md',
    blinkFeatureID: 5020,
    chromeStatusID: 4622243656630272,
  },
  'File System Access': {
    regEx:
      /\bshowOpenFilePicker\s*\(|showSaveFilePicker\s*\(|showDirectoryPicker\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'showOpenFilePicker' in self)(),
    featureDetection: `(async () => 'showOpenFilePicker' in self)()`,
    documentation: 'https://developer.chrome.com/articles/file-system-access/',
    blinkFeatureID: 3340,
    chromeStatusID: 6284708426022912,
  },
  'Gamepad': {
    regEx: /\bnavigator\.getGamepads\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getGamepads' in navigator)(),
    featureDetection: `(async () => 'getGamepads' in navigator)()`,
    documentation: 'https://web.dev/gamepad/',
    blinkFeatureID: 1916,
    chromeStatusID: 5118776383111168,
  },
  'getInstalledRelatedApps': {
    regEx: /\bnavigator\.getInstalledRelatedApps\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getInstalledRelatedApps' in navigator)(),
    featureDetection: `(async () => 'getInstalledRelatedApps' in navigator)()`,
    documentation: 'https://web.dev/get-installed-related-apps/',
    blinkFeatureID: 1870,
    chromeStatusID: 5695378309513216,
  },
  'Gravity Sensor': {
    regEx: /\bnew\s+GravitySensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'GravitySensor' in self)(),
    featureDetection: `(async () => 'GravitySensor' in self)()`,
    documentation: 'https://developer.chrome.com/articles/generic-sensor/',
    blinkFeatureID: 3795,
    chromeStatusID: 5384099747332096,
  },
  'Gyroscope': {
    regEx: /\bnew\s+Gyroscope\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Gyroscope' in self)(),
    featureDetection: `(async () => 'Gyroscope' in self)()`,
    documentation: 'https://developer.chrome.com/articles/generic-sensor/',
    blinkFeatureID: 1906,
    chromeStatusID: 5698781827825664,
  },
  'Handwriting Recognition': {
    regEx: /\bnavigator\.queryHandwritingRecognizerSupport\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'queryHandwritingRecognizerSupport' in navigator)(),
    featureDetection: `(async () => 'queryHandwritingRecognizerSupport' in navigator)()`,
    documentation:
      'https://developer.chrome.com/docs/web-platform/handwriting-recognition/',
    blinkFeatureID: 3893,
    chromeStatusID: 5263213807534080,
  },
  'HapticsDevice': {
    regEx: /\.haptics\.play\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'HapticsDevice' in self)(),
    featureDetection: `(async () => 'HapticsDevice' in self)()`,
    documentation:
      'https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/HapticsDevice/explainer.md',
    blinkFeatureID: undefined,
    chromeStatusID: 5720648543371264,
  },
  'Idle Detection': {
    regEx: /\bnew\s+IdleDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'IdleDetector' in self)(),
    featureDetection: `(async () => 'IdleDetector' in self)()`,
    documentation: 'https://developer.chrome.com/articles/idle-detection/',
    blinkFeatureID: 2834,
    chromeStatusID: 4590256452009984,
  },
  'Ink': {
    regEx: /\bnavigator\.ink\.requestPresenter\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'ink' in navigator)(),
    featureDetection: `(async () => 'ink' in navigator)()`,
    documentation:
      'https://blogs.windows.com/msedgedev/2021/08/18/enhancing-inking-on-the-web/',
    blinkFeatureID: 5017,
    chromeStatusID: 5961434129235968,
  },
  'Insertable streams for MediaStreamTrack': {
    regEx: /\bMediaStreamTrackProcessor\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'MediaStreamTrackProcessor' in self &&
      'MediaStreamTrackGenerator' in self)(),
    featureDetection: `(async () => 'MediaStreamTrackProcessor' in self && 'MediaStreamTrackGenerator' in self)()`,
    documentation:
      'https://developer.chrome.com/articles/mediastreamtrack-insertable-media-processing/',
    blinkFeatureID: 3729,
    chromeStatusID: 5499415634640896,
  },
  'Launch Handler': {
    regEx: /"launch_handler"/g,
    where: 'Web App Manifest',
    supported: (async () =>
      'launchQueue' in self && 'targetURL' in LaunchParams.prototype)(),
    featureDetection: `(async () => 'launchQueue' in self && 'targetURL' in LaunchParams.prototype)()`,
    documentation:
      'https://developer.chrome.com/docs/web-platform/launch-handler/',
    blinkFeatureID: 4080,
    chromeStatusID: 5722383233056768,
  },
  'Linear Acceleration Sensor': {
    regEx: /\bnew\s+LinearAccelerationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'LinearAccelerationSensor' in self)(),
    featureDetection: `(async () => 'LinearAccelerationSensor' in self)()`,
    documentation: 'https://developer.chrome.com/articles/generic-sensor/',
    blinkFeatureID: 2051,
    chromeStatusID: 5698781827825664,
  },
  'Local Font Access': {
    regEx: /\bqueryLocalFonts\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'queryLocalFonts' in self)(),
    featureDetection: `(async () => 'queryLocalFonts' in self)()`,
    documentation: 'https://developer.chrome.com/articles/local-fonts/',
    blinkFeatureID: 4211,
    chromeStatusID: 6234451761692672,
  },
  'Magnetometer': {
    regEx: /\bnew\s+Magnetometer\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Magnetometer' in self)(),
    featureDetection: `(async () => 'Magnetometer' in self)()`,
    documentation: 'https://developer.chrome.com/articles/generic-sensor/',
    blinkFeatureID: 1907,
    chromeStatusID: 5698781827825664,
  },
  'Media Capabilities': {
    regEx: /\bnavigator\.mediaCapabilities\.decodingInfo\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'mediaCapabilities' in navigator)(),
    featureDetection: `(async () => 'mediaCapabilities' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Media_Capabilities_API',
    blinkFeatureID: 2239,
    chromeStatusID: 5869632707624960,
  },
  'Media Session': {
    regEx:
      /\bnavigator\.mediaSession\.setActionHandler|navigator\.mediaSession\.metadata/g,
    where: 'JavaScript',
    supported: (async () => 'mediaSession' in navigator)(),
    featureDetection: `(async () => 'mediaSession' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API',
    blinkFeatureID: 1792,
    chromeStatusID: 5639924124483584,
  },
  'Window Management': {
    regEx: /\bgetScreenDetails\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'getScreenDetails' in self)(),
    featureDetection: `(async () => 'getScreenDetails' in self)()`,
    documentation: 'https://developer.chrome.com/articles/window-management/',
    blinkFeatureID: 3388,
    chromeStatusID: 5252960583942144,
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
    chromeStatusID: 5734842339688448,
  },
  'Origin Private File System': {
    regEx: /\bnavigator\.storage\.getDirectory\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () =>
      'StorageManager' in self && 'getDirectory' in StorageManager.prototype)(),
    featureDetection: `(async () => 'StorageManager' in self && 'getDirectory' in StorageManager.prototype)()`,
    documentation: 'https://web.dev/origin-private-file-system/',
    blinkFeatureID: 3428,
    chromeStatusID: 5702777582911488,
  },
  'Payment Handler': {
    regEx: /\.paymentManager\.instruments\.set\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'PaymentInstruments' in self)(),
    featureDetection: `(async () => 'PaymentInstruments' in self)()`,
    documentation: 'https://web.dev/registering-a-web-based-payment-app/',
    blinkFeatureID: 2397,
    chromeStatusID: 5160285237149696,
  },
  'Payment Request': {
    regEx: /\bnew\s+PaymentRequest\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'PaymentRequest' in self)(),
    featureDetection: `(async () => 'PaymentRequest' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API',
    blinkFeatureID: 2894,
    chromeStatusID: 5639348045217792,
  },
  'Periodic Background Sync': {
    regEx: /\bperiodicSync\.register\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'PeriodicSyncManager' in self)(),
    featureDetection: `(async () => 'PeriodicSyncManager' in self)()`,
    documentation:
      'https://developer.chrome.com/articles/periodic-background-sync/',
    blinkFeatureID: 2931,
    chromeStatusID: 5689383275462656,
  },
  'Persistent Storage': {
    regEx: /\bnavigator\.storage\.persist\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () =>
      'storage' in navigator && 'persist' in navigator.storage)(),
    featureDetection: `(async () => 'storage' in navigator && 'persist' in navigator.storage)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist',
    blinkFeatureID: 1369,
    chromeStatusID: 5715811364765696,
  },
  'Storage Buckets': {
    regEx: /\bnavigator\.storageBuckets\.open\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'storageBuckets' in navigator)(),
    featureDetection: `(async () => 'storageBuckets' in navigator)()`,
    documentation: 'https://developer.chrome.com/blog/storage-buckets/',
    blinkFeatureID: 4378,
    chromeStatusID: 5739224579964928,
  },
  'Pointer Lock (unadjustedMovement)': {
    regEx: /\bunadjustedMovement\s*:\s*/g,
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
    chromeStatusID: 5723553087356928,
  },
  'Protocol Handlers': {
    regEx: /"protocol_handlers"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation:
      'https://developer.chrome.com/articles/url-protocol-handler/',
    blinkFeatureID: 3884,
    chromeStatusID: 5151703944921088,
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
    blinkFeatureID: 371,
    chromeStatusID: 5416033485586432,
  },
  'Relative Orientation Sensor': {
    regEx: /\bnew\s+RelativeOrientationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'RelativeOrientationSensor' in self)(),
    featureDetection: `(async () => 'RelativeOrientationSensor' in self)()`,
    documentation: 'https://developer.chrome.com/articles/generic-sensor/',
    blinkFeatureID: 2019,
    chromeStatusID: 5698781827825664,
  },
  'Screen Wake Lock': {
    regEx: /\bnavigator\.wakeLock\.request\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'wakeLock' in navigator)(),
    featureDetection: `(async () => 'wakeLock' in navigator)()`,
    documentation: 'https://developer.chrome.com/articles/wake-lock/',
    blinkFeatureID: 3005,
    chromeStatusID: 4636879949398016,
  },
  'Service Worker': {
    regEx: /\bnavigator\.serviceWorker\.register\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'serviceWorker' in navigator)(),
    featureDetection: `(async () => 'serviceWorker' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API',
    blinkFeatureID: 990,
    chromeStatusID: 6561526227927040,
  },
  'Shape Detection (Barcodes)': {
    regEx: /\bnew\s+BarcodeDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'BarcodeDetector' in self)(),
    featureDetection: `(async () => 'BarcodeDetector' in self)()`,
    documentation: 'https://developer.chrome.com/articles/shape-detection/',
    blinkFeatureID: 3711,
    chromeStatusID: 4757990523535360,
  },
  'Shape Detection (Faces)': {
    regEx: /\bnew\s+FaceDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'FaceDetector' in self)(),
    featureDetection: `(async () => 'FaceDetector' in self)()`,
    documentation: 'https://developer.chrome.com/articles/shape-detection/',
    blinkFeatureID: 3712,
    chromeStatusID: 5678216012365824,
  },
  'Shape Detection (Texts)': {
    regEx: /\bnew\s+TextDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'TextDetector' in self)(),
    featureDetection: `(async () => 'TextDetector' in self)()`,
    documentation: 'https://developer.chrome.com/articles/shape-detection/',
    blinkFeatureID: 3713,
    chromeStatusID: 5644087665360896,
  },
  'Shortcuts': {
    regEx: /"shortcuts"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/app-shortcuts/',
    blinkFeatureID: undefined,
    chromeStatusID: 5706099464339456,
  },
  'Storage Estimation': {
    regEx: /\bnavigator\.storage\.estimate\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () =>
      'storage' in navigator && 'estimate' in navigator.storage)(),
    featureDetection: `(async () => 'storage' in navigator && 'estimate' in navigator.storage)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate',
    blinkFeatureID: 1371,
    chromeStatusID: 5630353511284736,
  },
  'Tabbed Application Mode': {
    regEx: /"tabbed"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/tabbed-application-mode/',
    blinkFeatureID: 4608,
    chromeStatusID: 5128143454076928,
  },
  'VirtualKeyboard': {
    regEx: /\bnavigator\.virtualKeyboard/g,
    where: 'JavaScript',
    supported: (async () => 'virtualKeyboard' in navigator)(),
    featureDetection: `(async () => 'virtualKeyboard' in navigator)()`,
    documentation:
      'https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/VirtualKeyboardAPI/explainer.md',
    blinkFeatureID: 4640,
    chromeStatusID: 5717448231747584,
  },
  'Web App Link Handling': {
    regEx: /"handle_links"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation:
      'https://github.com/WICG/pwa-url-handler/blob/main/handle_links/explainer.md',
    blinkFeatureID: 4109,
    chromeStatusID: 5740751225880576,
  },
  'Web Audio': {
    regEx: /\bnew\s+AudioContext\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'AudioContext' in self)(),
    featureDetection: `(async () => 'AudioContext' in self)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API',
    blinkFeatureID: 1698,
    chromeStatusID: 6261718720184320,
  },
  'Web Share': {
    regEx: /\bnavigator\.share\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'share' in navigator)(),
    featureDetection: `(async () => 'share' in navigator)()`,
    documentation: 'https://web.dev/web-share/',
    blinkFeatureID: 1501,
    chromeStatusID: 5668769141620736,
  },
  'Web Share (Files)': {
    regEx: /\bnavigator\.canShare\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'canShare' in navigator)(),
    featureDetection: `(async () => 'canShare' in navigator)()`,
    documentation: 'https://web.dev/web-share/',
    blinkFeatureID: 2737,
    chromeStatusID: 4777349178458112,
  },
  'Web Share Target': {
    regEx: /"share_target"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://developer.chrome.com/articles/web-share-target/',
    blinkFeatureID: undefined,
    chromeStatusID: 5662315307335680,
  },
  'Web Share Target (Files)': {
    regEx: /"enctype"\s*:\s*"multipart\/form-data"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://developer.chrome.com/articles/web-share-target/',
    blinkFeatureID: undefined,
    chromeStatusID: 6124071381106688,
  },
  'Web Bluetooth': {
    regEx: /\bnavigator\.bluetooth\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'bluetooth' in navigator)(),
    featureDetection: `(async () => 'bluetooth' in navigator)()`,
    documentation: 'https://developer.chrome.com/articles/bluetooth/',
    blinkFeatureID: 1670,
    chromeStatusID: 5264933985976320,
  },
  'WebCodecs': {
    regEx: /\bnew\s+MediaStreamTrackProcessor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'MediaStreamTrackProcessor' in self)(),
    featureDetection: `(async () => 'MediaStreamTrackProcessor' in self)()`,
    documentation: 'https://developer.chrome.com/articles/webcodecs/',
    blinkFeatureID: 3728,
    chromeStatusID: 5669293909868544,
  },
  'WebGPU': {
    regEx: /\bnavigator\.gpu\.requestAdapter\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'gpu' in navigator)(),
    featureDetection: `(async () => 'gpu' in navigator)()`,
    documentation: 'https://developer.chrome.com/docs/web-platform/webgpu/',
    blinkFeatureID: 3888,
    chromeStatusID: 6213121689518080,
  },
  'WebHID': {
    regEx: /\bnavigator\.hid\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'hid' in navigator)(),
    featureDetection: `(async () => 'hid' in navigator)()`,
    documentation: 'https://developer.chrome.com/articles/hid/',
    blinkFeatureID: 2866,
    chromeStatusID: 5172464636133376,
  },
  'Web MIDI': {
    regEx: /\bnavigator\.requestMIDIAccess\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'requestMIDIAccess' in navigator)(),
    featureDetection: `(async () => 'requestMIDIAccess' in navigator)()`,
    documentation:
      'https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API',
    blinkFeatureID: 2029,
    chromeStatusID: 4923613069180928,
  },
  'Web NFC': {
    regEx: /\bnew\s+NDEFReader\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'NDEFReader' in self)(),
    featureDetection: `(async () => 'NDEFReader' in self)()`,
    documentation: 'https://developer.chrome.com/articles/nfc/',
    blinkFeatureID: 3094,
    chromeStatusID: 6261030015467520,
  },
  'WebOTP': {
    regEx: /\btransport\s*:\s*\[["']sms["']\]/g,
    where: 'JavaScript',
    supported: (async () => 'OTPCredential' in self)(),
    featureDetection: `(async () => 'OTPCredential' in self)()`,
    documentation: 'https://developer.chrome.com/articles/web-otp/',
    blinkFeatureID: 2880,
    chromeStatusID: 5873577578463232,
  },
  'Web Serial': {
    regEx: /\bnavigator\.serial\.requestPort\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'serial' in navigator)(),
    featureDetection: `(async () => 'serial' in navigator)()`,
    documentation: 'https://developer.chrome.com/articles/serial/',
    blinkFeatureID: 2546,
    chromeStatusID: 6577673212002304,
  },
  'WebSocketStream': {
    regEx: /\bnew\s+WebSocketStream\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'WebSocketStream' in self)(),
    featureDetection: `(async () => 'WebSocketStream' in self)()`,
    documentation: 'https://developer.chrome.com/articles/websocketstream/',
    blinkFeatureID: 3018,
    chromeStatusID: 5189728691290112,
  },
  'WebTransport': {
    regEx: /\bnew\s+WebTransport\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'WebTransport' in self)(),
    featureDetection: `(async () => 'WebTransport' in self)()`,
    documentation: 'https://developer.chrome.com/articles/webtransport/',
    blinkFeatureID: 3472,
    chromeStatusID: 4854144902889472,
  },
  'WebUSB': {
    regEx: /\bnavigator\.usb\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'usb' in navigator)(),
    featureDetection: `(async () => 'usb' in navigator)()`,
    documentation: 'https://developer.chrome.com/articles/usb/',
    blinkFeatureID: 1520,
    chromeStatusID: 5651917954875392,
  },
  'Window Controls Overlay': {
    regEx: /"window-controls-overlay"/g,
    where: 'Web App Manifest',
    supported: (async () => 'windowControlsOverlay' in navigator)(),
    featureDetection: `(async () => 'windowControlsOverlay' in navigator)()`,
    documentation: 'https://web.dev/window-controls-overlay/',
    blinkFeatureID: 3902,
    chromeStatusID: 5741247866077184,
  },
  'Prompt': {
    regEx: /\bLanguageModel\.create\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'LanguageModel' in self)(),
    featureDetection: `(async () => 'LanguageModel' in self)()`,
    documentation: 'https://developer.chrome.com/docs/ai/prompt-api',
    blinkFeatureID: 5405,
    chromeStatusID: 5134603979063296,
  },
  'Summarizer': {
    regEx: /\bSummarizer\.create\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Summarizer' in self)(),
    featureDetection: `(async () => 'Summarizer' in self)()`,
    documentation: 'https://developer.chrome.com/docs/ai/summarizer-api',
    blinkFeatureID: 5445,
    chromeStatusID: 5193953788559360,
  },
  'Writer': {
    regEx: /\bWriter\.create\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Writer' in self)(),
    featureDetection: `(async () => 'Writer' in self)()`,
    documentation: 'https://developer.chrome.com/docs/ai/writer-api',
    blinkFeatureID: 5417,
    chromeStatusID: 4712595362414592,
  },
  'Rewriter': {
    regEx: /\bRewriter\.create\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Rewriter' in self)(),
    featureDetection: `(async () => 'Rewriter' in self)()`,
    documentation: 'https://developer.chrome.com/docs/ai/rewriter-api',
    blinkFeatureID: 5431,
    chromeStatusID: 5112320150470656,
  },
  'Proofreader': {
    regEx: /\bProofreader\.create\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Proofreader' in self)(),
    featureDetection: `(async () => 'Proofreader' in self)()`,
    documentation: 'https://github.com/webmachinelearning/proofreader-api',
    blinkFeatureID: 5567,
    chromeStatusID: 5164677291835392,
  },
  'Translator': {
    regEx: /\bTranslator\.create\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Translator' in self)(),
    featureDetection: `(async () => 'Translator' in self)()`,
    documentation: 'https://developer.chrome.com/docs/ai/translator-api',
    blinkFeatureID: 5392,
    chromeStatusID: 5172811302961152,
  },
  'LanguageDetector': {
    regEx: /\bLanguageDetector\.create\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'LanguageDetector' in self)(),
    featureDetection: `(async () => 'LanguageDetector' in self)()`,
    documentation: 'https://developer.chrome.com/docs/ai/language-detection',
    blinkFeatureID: 5401,
    chromeStatusID: 6494349985841152,
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
    /\.m?js/.test(url) &&
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
