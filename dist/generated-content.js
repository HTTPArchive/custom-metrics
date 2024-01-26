let generatedContentPercent = 0;
let generatedContent = 0;

const byteSize = (str) => new Blob([str]).size;

let htmlInitial = $WPT_BODIES[0].response_body;
let htmlAfter = document.documentElement.outerHTML;

if (htmlInitial && htmlAfter) {
  let htmlInitialSize = byteSize(htmlInitial);
  let htmlAfterSize = byteSize(htmlAfter);
  generatedContentPercent = 1 - (htmlInitialSize / htmlAfterSize);
  generatedContent = (htmlAfterSize - htmlInitialSize) / 1024;
}

return {
  percent: generatedContentPercent.toFixed(4),
  sizeInKB: generatedContent.toFixed(2),
};
