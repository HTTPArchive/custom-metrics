//[example]
// Example custom metrics code
return JSON.stringify({
  // example placeholder
  metricName: "value",

  // array of meta nodes
  meta_nodes: document.querySelectorAll('head meta'),

  // check if there is any picture tag containing an img tag
  has_picture_img: document.querySelectorAll('picture img').length > 0
})
