import React from 'react';
import Head from 'next/head';
import { HeroSection } from '@/components/home/HeroSection';
import { LiveLoungesGrid } from '@/components/home/LiveLoungesGrid';
import { PhilosophySection } from '@/components/home/PhilosophySection';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>NOCTURNE — Music hits different together</title>
      </Head>
      <div className="flex flex-col min-h-full pb-32">
        <HeroSection />
        <LiveLoungesGrid />
        <PhilosophySection />
        <Footer />
      </div>
    </>
  );
}
