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
  for (let embed of embedBlocks) {
    let embedClasses = embed.className.split( ' ' );

    // Find the provider classname, which starts with "is-provider-".
    let provider = embedClasses.find( function( className ) {
      return className.startsWith( 'is-provider-' );
    } );

    if (provider) {
      // Remove the "is-provider-" prefix to get the provider name.
      provider = provider.replace( 'is-provider-', '' );
      embedsByType[ provider ] = embedsByType[ provider ] || 0;
      embedsByType[ provider ]++;
    }
  }

  return {
    total: embedBlocks.length,
    total_by_type: embedsByType
  }
}

/**
 * Obtains data about scripts that WordPress prints on the page.
 *
 * @returns {{}[]}
 */
function getWordPressScripts() {
  const entries = [];

  /**
   * Checks whether the provided element is an inline script.
   *
   * @param {?Element} element Element to examine. May be null.
   * @return {?number} Size of the inline script or null if the element isn't an inline script.
   */
  const getInlineScriptSize = (element) => {
    if (element instanceof HTMLScriptElement && !element.src) {
      return element.textContent.length;
    }
    return null;
  };

  const scripts = document.querySelectorAll('script[src][id$="-js"]');
  for (const script of scripts) {
    /** @var HTMLScriptElement script */
    const handle = script.id.replace(/-js$/, '');
    entries.push({
      handle,
      src: script.src,
      in_footer: script.parentNode !== document.head,
      async: script.async,
      defer: script.defer,
      intended_strategy: script.dataset.wpStrategy || null,
      after_script_size: getInlineScriptSize(document.getElementById(`${handle}-js-after`)),
      before_script_size: getInlineScriptSize(document.getElementById(`${handle}-js-before`)),
      extra_script_size: getInlineScriptSize(document.getElementById(`${handle}-js-extra`)),
      translations_script_size: getInlineScriptSize(document.getElementById(`${handle}-js-translations`)),
    });
  }
  return entries;
}

const wordpress = {
  block_theme: usesBlockTheme(),
  has_embed_block: hasWordPressEmbedBlock(),
  embed_block_count: getWordPressEmbedBlockCounts(),
  scripts: getWordPressScripts(),
};

return {
  wordpress
};
