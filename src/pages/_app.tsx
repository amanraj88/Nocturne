import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';
import { LoungeProvider } from '@/context/LoungeContext';
import { Header } from '@/components/layout/Header';
import { SearchModal } from '@/components/lounge/SearchModal';
import { CreateRoomModal } from '@/components/lounge/CreateRoomModal';
import { MiniPlayer } from '@/components/layout/MiniPlayer';

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
      <div
        className="font-sans flex min-h-screen flex-col bg-[var(--color-deep-ink)] text-[var(--color-warm-bone)] selection:bg-[#FF5C8A] selection:text-white w-full max-w-full overflow-x-hidden transition-colors duration-200"
        suppressHydrationWarning
      >
        <Header />
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <Component {...pageProps} />
        </main>
        <MiniPlayer />
        <SearchModal />
        <CreateRoomModal />
      </div>
    </LoungeProvider>
  );
}
