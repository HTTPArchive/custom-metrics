//[cms]

function usesBlockTheme() {
  return !!document.querySelector('div.wp-site-blocks');
}

const wordpress = {
  block_theme: usesBlockTheme()
};

return {
  wordpress
};
