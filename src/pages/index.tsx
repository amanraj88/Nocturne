import React from 'react';
import Head from 'next/head';
import { HeroSection } from '@/components/home/HeroSection';
import { LiveLoungesGrid } from '@/components/home/LiveLoungesGrid';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>NOCTURNE — Listen to YouTube together</title>
      </Head>
      <div className="flex flex-col min-h-full">
        <HeroSection />
        <LiveLoungesGrid />
        <Footer />
      </div>
    </>
  );
}
