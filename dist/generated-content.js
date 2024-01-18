let generatedContentPercent = 0;
let generatedContent = 0;

const byteSize = (str) => new Blob([str]).size;

let htmlInitial = $WPT_BODIES[0].response_body;
let htmlAfter = document.documentElement.outerHTML;

if (htmlInitial && htmlAfter) {
  let htmlInitialSize = byteSize(htmlInitial);
  let htmlAfterSize = byteSize(htmlAfter);
  generatedContentPercent = 100 - (htmlInitialSize / htmlAfterSize) * 100;
  generatedContent = (htmlAfterSize - htmlInitialSize) / 1024;
}

return JSON.stringify({
  percent: generatedContentPercent.toFixed(2),
  sizeInKB: generatedContent.toFixed(2),
});
