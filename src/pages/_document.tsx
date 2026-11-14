import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="overflow-x-clip" data-quality="high" suppressHydrationWarning>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0F0E17" id="theme-color-meta" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%231A1829' stroke='%238B5CF6' stroke-width='6'/><circle cx='50' cy='50' r='14' fill='%23FF5C8A'/></svg>"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('nocturne_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : (prefersDark ? 'dark' : 'light');
                  var root = document.documentElement;
                  root.classList.remove('dark', 'light');
                  root.classList.add(theme);
                  root.setAttribute('data-theme', theme);
                  var metaScheme = document.querySelector('meta[name="color-scheme"]');
                  if (metaScheme) metaScheme.setAttribute('content', theme);
                  var metaTheme = document.getElementById('theme-color-meta');
                  if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#F8F7FC' : '#0F0E17');
                } catch (e) {}
              })();
            `,
          }}
        />
      </Head>
      <body
        className="bg-[var(--color-deep-ink)] text-[var(--color-warm-bone)] antialiased overflow-x-clip selection:bg-[#FF5C8A] selection:text-white"
        suppressHydrationWarning
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
