import React, { useLayoutEffect } from 'react';
import { localizeProductCopy } from './productVocabulary';

const PRESENTATION_ATTRIBUTES = [
  'aria-label',
  'aria-description',
  'title',
  'placeholder',
  'alt',
] as const;

function localizeAttribute(element: Element, attribute: string): void {
  const current = element.getAttribute(attribute);
  if (!current) return;

  const localized = localizeProductCopy(current);
  if (localized !== current) element.setAttribute(attribute, localized);
}

function localizeNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const current = node.textContent;
    if (!current) return;

    const localized = localizeProductCopy(current);
    if (localized !== current) node.textContent = localized;
    return;
  }

  if (!(node instanceof Element)) return;

  for (const attribute of PRESENTATION_ATTRIBUTES) {
    localizeAttribute(node, attribute);
  }

  for (const child of node.childNodes) {
    localizeNode(child);
  }
}

function localizeDocumentMetadata(): void {
  document.title = localizeProductCopy(document.title);

  document
    .querySelectorAll<HTMLMetaElement>(
      'meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]',
    )
    .forEach((meta) => {
      const current = meta.content;
      const localized = localizeProductCopy(current);
      if (localized !== current) meta.content = localized;
    });
}

/**
 * German product-language boundary.
 *
 * The application historically mixes the English display word "Crypto" with
 * the German product vocabulary. This boundary normalizes presentation copy to
 * "Krypto" while deliberately preserving technical contracts, route keys,
 * component names and provider payloads.
 */
export function ProductVocabularyBoundary({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    const root = document.getElementById('root') ?? document.body;

    localizeNode(root);
    localizeDocumentMetadata();

    const appObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          localizeNode(mutation.target);
          continue;
        }

        if (mutation.type === 'attributes') {
          if (mutation.target instanceof Element && mutation.attributeName) {
            localizeAttribute(mutation.target, mutation.attributeName);
          }
          continue;
        }

        for (const addedNode of mutation.addedNodes) {
          localizeNode(addedNode);
        }
      }
    });

    appObserver.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...PRESENTATION_ATTRIBUTES],
    });

    const headObserver = new MutationObserver(() => localizeDocumentMetadata());
    headObserver.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['content'],
    });

    return () => {
      appObserver.disconnect();
      headObserver.disconnect();
    };
  }, []);

  return <>{children}</>;
}
