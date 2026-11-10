/* Render Jekyll/Kramdown's LaTeX delimiters, including hidden Reading notes. */
(() => {
  document.querySelectorAll('main article').forEach((article) => {
    // Older Kramdown releases use math/tex script elements instead of delimiters.
    article.querySelectorAll('script[type^="math/tex"]').forEach((source) => {
      const displayMode = source.type.includes('mode=display');
      const rendered = document.createElement(displayMode ? 'div' : 'span');
      katex.render(source.textContent, rendered, { displayMode, throwOnError: false, trust: false });
      source.replaceWith(rendered);
    });
    renderMathInElement(article, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      trust: false
    });
  });
})();
