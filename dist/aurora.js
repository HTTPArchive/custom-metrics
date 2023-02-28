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
// Nuxt doesn't expose its own version yet, but does expose its Vue version
function getVueVersionForNuxt() {
  const nuxt2Version = window.$nuxt?.$root?.constructor?.version;
  const nuxt3Version = document.querySelector('#__nuxt')?.__vue_app__?.version;
  return nuxt2Version || nuxt3Version;
}

// Detects React version (set earlier by inject_script)
function getReactVersion() {
  return window.react_renderer_version;
}

return {
    ng_version: getAngularVersion() || null,
    ng_img_user: isAngularImageDirUser(),
    ng_priority_img_count: getAngularImagePriorityCount(),
    nuxt_version: getVueVersionForNuxt() || null,
    react_version: getReactVersion() || null
};
