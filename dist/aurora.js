//[aurora]
// Uncomment the previous line for testing on webpagetest.org

// Wrap individual metric calls so errors don't break metrics in entire file.
function runSafely(cb) {
  try {
    return cb() || null;
  } catch (e) {
    return logError(e);
  }
}

function logError(e) {
  try {
    return `${e?.name}: ${e?.message}`;
  } catch {
    return null;
  }
}

// Detects Angular version, which is added through runtime JS
function getAngularVersion() {
  const versionEl = document.querySelector('[ng-version]');
  return versionEl?.getAttribute('ng-version');
}

// Detects if NgOptimizedImage is in use on the page
function isAngularImageDirUser() {
  return !!document.querySelector('img[ng-img]');
}

// Detects count of NgOptimizedImage instances with a priority attr
function getAngularImagePriorityCount() {
    return document.querySelectorAll('img[ng-img][priority]').length;
}

// Detects Vue version for Nuxt apps
// Nuxt only exposes its own version for Nuxt apps on v3.3+
function getVueVersionForNuxt() {
  const nuxt2Version = window.$nuxt?.$root?.constructor?.version;
  const nuxt3Version = document.querySelector('#__nuxt')?.__vue_app__?.version;
  return nuxt2Version || nuxt3Version;
}

// Detects Nuxt version directly for Nuxt 3.3 and later
function getNuxtVersion() {
  return window['__unctx__']?.get('nuxt-app')?.use()?.versions?.nuxt;
}

// Detects React version (set earlier by inject_script)
function getReactVersion() {
  return window.react_renderer_version;
}

return {
    ng_version: runSafely(getAngularVersion),
    ng_img_user: runSafely(isAngularImageDirUser),
    ng_priority_img_count: runSafely(getAngularImagePriorityCount),
    nuxt_version: runSafely(getNuxtVersion),
    nuxt_vue_version: runSafely(getVueVersionForNuxt),
    react_version: runSafely(getReactVersion)
};
