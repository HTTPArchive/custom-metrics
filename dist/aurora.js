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
    return `Error ${e?.name}: ${e?.message}`;
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
    return document.querySelectorAll('img[ng-img]:is([priority],[fetchpriority=high])').length;
}

// Detects Angular server context
function getAngularServerContext() {
  const contextEl = document.querySelector('[ng-server-context]');
  return contextEl?.getAttribute('ng-server-context');
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

// Detects Next.js version
function getNextVersion() {
  return window.next.version;
}

// Detects if the Next.js Script component is in use on the page
function isNextScriptUser() {
  return !!document.querySelector('script[data-nscript]');
}

// Detects if the Next.js third parties lib is in use on the page
function isNextThirdPartiesUser() {
  return !!document.querySelector('script[data-ntpc]');
}

// Detects count of script tags injected with the Next.js Script component using the beforeInteractive strategy
function getNextScriptBeforeInteractiveCount() {
  return document.querySelectorAll('script[data-nscript=beforeInteractive]').length;
}

// Detects count of script tags injected with the Next.js Script component using the afterInteractive strategy
function getNextScriptAfterInteractiveCount() {
  return document.querySelectorAll('script[data-nscript=afterInteractive]').length;
}

// Detects count of script tags injected with the Next.js Script component using the lazyOnload strategy
function getNextScriptLazyOnLoadCount() {
  return document.querySelectorAll('script[data-nscript=lazyOnload]').length;
}

// Detects count of script tags injected with the Next.js Script component using the worker strategy
function getNextScriptWorkerCount() {
  return document.querySelectorAll('script[data-nscript=worker]').length;
}

// Detects React version (set earlier by inject_script)
function getReactVersion() {
  return window.react_renderer_version;
}

// Detects Svelte version
function getSvelteVersion() {
  return window.__svelte?.v ? Array.from(window.__svelte?.v).toString() : null;
}

// Detects standard feature flag usage
function getFeatureFlags() {
  function getFeatureNames(name) {
    return window.performance.getEntriesByName(name).map(mark => mark.detail?.feature).filter(Boolean);
  }

  return Array.from(new Set([
    // Some frameworks used the old name before it changed
    ...getFeatureNames("mark_use_counter"),
    ...getFeatureNames("mark_feature_usage"),
  ]));
}

return {
    ng_version: runSafely(getAngularVersion),
    ng_img_user: runSafely(isAngularImageDirUser),
    ng_priority_img_count: runSafely(getAngularImagePriorityCount),
    ng_server_context: runSafely(getAngularServerContext),
    nuxt_version: runSafely(getNuxtVersion),
    nuxt_vue_version: runSafely(getVueVersionForNuxt),
    next_version: runSafely(getNextVersion),
    next_is_script_user: runSafely(isNextScriptUser),
    next_is_third_parties_user: runSafely(isNextThirdPartiesUser),
    next_script_before_interactive_count: runSafely(getNextScriptBeforeInteractiveCount),
    next_script_after_interactive_count: runSafely(getNextScriptAfterInteractiveCount),
    next_script_lazy_on_load_count: runSafely(getNextScriptLazyOnLoadCount),
    next_script_worker_count: runSafely(getNextScriptWorkerCount),
    react_version: runSafely(getReactVersion),
    svelte_version: runSafely(getSvelteVersion),
    feature_flags: runSafely(getFeatureFlags),
};
