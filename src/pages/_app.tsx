import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';
import { LoungeProvider } from '@/context/LoungeContext';
import { Header } from '@/components/layout/Header';
import { SearchModal } from '@/components/lounge/SearchModal';
import { CreateRoomModal } from '@/components/lounge/CreateRoomModal';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LoungeProvider>
      <Head>
        <title>NOCTURNE: Music hits different together</title>
        <meta
          name="description"
          content="Independent electronic music culture-inspired social listening lounge."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="font-sans flex min-h-screen flex-col bg-deep-ink text-warm-bone selection:bg-mineral selection:text-deep-ink w-full max-w-full overflow-x-hidden">
        <Header />
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <Component {...pageProps} />
        </main>
        <SearchModal />
        <CreateRoomModal />
      </div>
    </LoungeProvider>
  );
}
