//[cms]

function usesBlockTheme() {
  return !!document.querySelector('div.wp-site-blocks');
}

// Detects if a WordPress embed block is on the page
function hasWordPressEmbedBlock() {
  return !!document.querySelector('figure.wp-block-embed');
}

// Count the number of WordPress embed blocks on the page, including a breakdown by type
function getWordPressEmbedBlockCounts() {
  const embedBlocks = document.querySelectorAll('figure.wp-block-embed');
  const embedsByType = [];
  for ( let embed of embedBlocks ) {
    let provider = embed.className.split( ' ' ).pop().split( "-" ).pop();
    embedsByType[ provider ] = embedsByType[ provider ] || 0;
    embedsByType[ provider ]++;
  }

  return {
    total: embedBlocks.length,
    total_by_type: embedsByType
  }
}

const wordpress = {
  block_theme: usesBlockTheme(),
  has_embed_block: hasWordPressEmbedBlock(),
  embed_block_count: getWordPressEmbedBlockCounts()
};

return {
  wordpress
};
