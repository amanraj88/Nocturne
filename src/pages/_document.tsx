import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark" data-quality="high">
      <Head>
        <meta name="theme-color" content="#0B0A10" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>" />
      </Head>
      <body className="bg-midnight-900 text-zinc-100 antialiased bg-grain selection:bg-lavender-500 selection:text-midnight-950">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
