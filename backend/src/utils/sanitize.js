const sanitizeHtml = require('sanitize-html');

// Rich text written in the admin (blog posts, CMS pages, product descriptions) is cleaned before it is stored.
const richText = (html) =>
  sanitizeHtml(String(html || ''), {
    allowedTags: ['h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption', 'span', 'sup', 'sub'],
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
      // Browsers' editors produce a few tags outside the list; map them instead of losing the formatting / line breaks.
      strike: 's',
      del: 's',
      ins: 'u',
      h1: 'h2',
      h5: 'h4',
      h6: 'h4',
      div: 'p',
    },
  });

module.exports = { richText };
