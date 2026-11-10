import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark overflow-x-clip" data-quality="high">
      <Head>
        <meta name="theme-color" content="#101514" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23191E1B' stroke='%23A0B7A8' stroke-width='6'/><circle cx='50' cy='50' r='14' fill='%23A0B7A8'/></svg>"
        />
      </Head>
      <body className="bg-deep-ink text-warm-bone antialiased bg-grain overflow-x-clip selection:bg-mineral selection:text-deep-ink">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
