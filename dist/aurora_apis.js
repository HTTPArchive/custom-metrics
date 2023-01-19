//[aurora]
// Uncomment the previous line for testing on webpagetest.org

// Detects if NgOptimizedImage is in use on the page
function isAngularImageDirUser() {
  return !!document.querySelector('img[ng-img]');
}

// Detects count of NgOptimizedImage instances with a priority attr 
function getAngularImagePriorityCount() {
    return document.querySelectorAll('img[ng-img][priority]').length;
}

return JSON.stringify({
    ng_img_user: isAngularImageDirUser(),
    ng_priority_img_count: getAngularImagePriorityCount()
});