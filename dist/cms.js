//[cms]

function usesBlockTheme() {
  return !!document.querySelector('div.wp-site-blocks');
}

const wordpress = {
  block_theme: usesBlockTheme(),
  has_embed_block: hasWordPressEmbedBlock()
};

return {
  wordpress
};

// Detects if a WordPress embed block is on the page
function hasWordPressEmbedBlock() {
  return !!document.querySelector('div.wp-block-embed');
}