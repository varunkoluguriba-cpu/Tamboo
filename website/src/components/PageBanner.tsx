import type { ReactNode } from 'react';

// Illustrated header strip used at the top of the main listing pages.
export default function PageBanner({ title, sub, art, children }: { title: string; sub?: string; art: ReactNode; children?: ReactNode }) {
  return (
    <section className="page-banner">
      <div className="page-banner-copy">
        <h1>{title}</h1>
        {!!sub && <p>{sub}</p>}
        {children}
      </div>
      <div className="page-banner-art">{art}</div>
    </section>
  );
}
