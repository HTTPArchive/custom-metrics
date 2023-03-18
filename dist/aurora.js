//[aurora]
// Uncomment the previous line for testing on webpagetest.org

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
  return __unctx__?.get('nuxt-app')?.use()?.versions?.nuxt;
}

// Detects React version (set earlier by inject_script)
function getReactVersion() {
  return window.react_renderer_version;
}

return {
    ng_version: getAngularVersion() || null,
    ng_img_user: isAngularImageDirUser(),
    ng_priority_img_count: getAngularImagePriorityCount(),
    nuxt_version: getNuxtVersion() || null,
    nuxt_vue_version: getVueVersionForNuxt() || null,
    react_version: getReactVersion() || null
};
