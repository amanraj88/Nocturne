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
        <title>NOCTURNE: Collaborative Listening Lounge</title>
        <meta
          name="description"
          content="Intimate after-hours collaborative music lounge with synchronized playback."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex min-h-screen flex-col bg-obsidian text-ivory">
        <Header />
        <main className="flex-1">
          <Component {...pageProps} />
        </main>
        <SearchModal />
        <CreateRoomModal />
      </div>
    </LoungeProvider>
  );
}
