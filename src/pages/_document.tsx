import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark overflow-x-clip" data-quality="high">
      <Head>
        <meta name="theme-color" content="#09080E" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23191624' stroke='%23B99AFF' stroke-width='6'/><circle cx='50' cy='50' r='14' fill='%23B99AFF'/></svg>"
        />
      </Head>
      <body className="bg-obsidian text-ivory antialiased bg-grain overflow-x-clip selection:bg-lavender selection:text-obsidian">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
