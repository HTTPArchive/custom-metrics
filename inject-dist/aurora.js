
// If set, React will call the provided inject() function to expose
// version information. It can then be picked up by custom metrics.
__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  supportsFiber: true,
  inject(renderer) {
    window.react_renderer_version = renderer.version;
  }
}
