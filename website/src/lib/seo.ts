import { useEffect } from 'react';

// Per-page <title> and meta description, so search results and shared links describe the page.
const DEFAULT_TITLE = 'Tamboo — Function halls, farm houses & event rentals in Hyderabad';
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Tamboo` : DEFAULT_TITLE;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description.slice(0, 160));
  }, [title, description]);
}
