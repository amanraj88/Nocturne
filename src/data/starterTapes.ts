export interface StarterTrack {
  title: string;
  artist: string;
  youtubeUrl: string;
  youtubeId: string;
  durationSeconds: number;
  thumbnailUrl: string;
}

export type TapeMood = 'Late Night' | 'Deep Focus' | 'Electronic' | 'Ambient';

export interface StarterTape {
  id: string;
  title: string;
  mood: TapeMood;
  subtitle: string;
  totalDurationLabel: string;
  tracks: StarterTrack[];
}

export const STARTER_TAPES: StarterTape[] = [
  {
    id: 'after-hours-electronic',
    title: 'After Hours Electronic',
    mood: 'Electronic',
    subtitle: 'Hypnotic minimal techno, modular synthesis, and late night low-end.',
    totalDurationLabel: 'Total 38m · 6 tracks',
    tracks: [
      {
        title: 'Glue',
        artist: 'Bicep',
        youtubeUrl: 'https://www.youtube.com/watch?v=A7ZxRs45tTg',
        youtubeId: 'A7ZxRs45tTg',
        durationSeconds: 270,
        thumbnailUrl: 'https://i.ytimg.com/vi/A7ZxRs45tTg/hqdefault.jpg',
      },
      {
        title: 'Bad Kingdom',
        artist: 'Moderat',
        youtubeUrl: 'https://www.youtube.com/watch?v=3NPxqXMZq7o',
        youtubeId: '3NPxqXMZq7o',
        durationSeconds: 345,
        thumbnailUrl: 'https://i.ytimg.com/vi/3NPxqXMZq7o/hqdefault.jpg',
      },
      {
        title: 'Silhouettes',
        artist: 'Floating Points',
        youtubeUrl: 'https://www.youtube.com/watch?v=d6C0bNDqf3Y',
        youtubeId: 'd6C0bNDqf3Y',
        durationSeconds: 380,
        thumbnailUrl: 'https://i.ytimg.com/vi/d6C0bNDqf3Y/hqdefault.jpg',
      },
      {
        title: 'Midnight City',
        artist: 'M83',
        youtubeUrl: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
        youtubeId: 'L_LUpnjgPso',
        durationSeconds: 244,
        thumbnailUrl: 'https://i.ytimg.com/vi/L_LUpnjgPso/hqdefault.jpg',
      },
      {
        title: 'Cirrus',
        artist: 'Bonobo',
        youtubeUrl: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
        youtubeId: 'M576WGiDBdQ',
        durationSeconds: 352,
        thumbnailUrl: 'https://i.ytimg.com/vi/M576WGiDBdQ/hqdefault.jpg',
      },
      {
        title: 'Kollabs',
        artist: 'Four Tet',
        youtubeUrl: 'https://www.youtube.com/watch?v=2OEL4P1Rz04',
        youtubeId: '2OEL4P1Rz04',
        durationSeconds: 280,
        thumbnailUrl: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg',
      },
    ],
  },
  {
    id: 'sub-bass-and-rain',
    title: 'Sub-Bass & Rain',
    mood: 'Ambient',
    subtitle: 'Downtempo vinyl hiss, rainy asphalt tones, and fractured post-garage.',
    totalDurationLabel: 'Total 32m · 5 tracks',
    tracks: [
      {
        title: 'Archangel',
        artist: 'Burial',
        youtubeUrl: 'https://www.youtube.com/watch?v=4y33h81phKU',
        youtubeId: '4y33h81phKU',
        durationSeconds: 240,
        thumbnailUrl: 'https://i.ytimg.com/vi/4y33h81phKU/hqdefault.jpg',
      },
      {
        title: 'Dayvan Cowboy',
        artist: 'Boards of Canada',
        youtubeUrl: 'https://www.youtube.com/watch?v=Rk_sAHh9s08',
        youtubeId: 'Rk_sAHh9s08',
        durationSeconds: 300,
        thumbnailUrl: 'https://i.ytimg.com/vi/Rk_sAHh9s08/hqdefault.jpg',
      },
      {
        title: 'Untrue',
        artist: 'Burial',
        youtubeUrl: 'https://www.youtube.com/watch?v=4y33h81phKU',
        youtubeId: '4y33h81phKU',
        durationSeconds: 375,
        thumbnailUrl: 'https://i.ytimg.com/vi/4y33h81phKU/hqdefault.jpg',
      },
      {
        title: 'Odyssey',
        artist: 'Rival Consoles',
        youtubeUrl: 'https://www.youtube.com/watch?v=fKopy74weus',
        youtubeId: 'fKopy74weus',
        durationSeconds: 360,
        thumbnailUrl: 'https://i.ytimg.com/vi/fKopy74weus/hqdefault.jpg',
      },
      {
        title: 'Cirrus Echo',
        artist: 'Bonobo',
        youtubeUrl: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
        youtubeId: 'M576WGiDBdQ',
        durationSeconds: 352,
        thumbnailUrl: 'https://i.ytimg.com/vi/M576WGiDBdQ/hqdefault.jpg',
      },
    ],
  },
  {
    id: 'midnight-analog',
    title: 'Midnight Analog',
    mood: 'Late Night',
    subtitle: 'Warm analog synthesizers, tape saturation, and twilight drift.',
    totalDurationLabel: 'Total 35m · 5 tracks',
    tracks: [
      {
        title: 'Awake',
        artist: 'Tycho',
        youtubeUrl: 'https://www.youtube.com/watch?v=V-_O7nl0Ii0',
        youtubeId: 'V-_O7nl0Ii0',
        durationSeconds: 283,
        thumbnailUrl: 'https://i.ytimg.com/vi/V-_O7nl0Ii0/hqdefault.jpg',
      },
      {
        title: 'Cirrus',
        artist: 'Bonobo',
        youtubeUrl: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
        youtubeId: 'M576WGiDBdQ',
        durationSeconds: 352,
        thumbnailUrl: 'https://i.ytimg.com/vi/M576WGiDBdQ/hqdefault.jpg',
      },
      {
        title: 'Midnight City',
        artist: 'M83',
        youtubeUrl: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
        youtubeId: 'L_LUpnjgPso',
        durationSeconds: 244,
        thumbnailUrl: 'https://i.ytimg.com/vi/L_LUpnjgPso/hqdefault.jpg',
      },
      {
        title: 'Glue',
        artist: 'Bicep',
        youtubeUrl: 'https://www.youtube.com/watch?v=A7ZxRs45tTg',
        youtubeId: 'A7ZxRs45tTg',
        durationSeconds: 270,
        thumbnailUrl: 'https://i.ytimg.com/vi/A7ZxRs45tTg/hqdefault.jpg',
      },
      {
        title: 'Bad Kingdom',
        artist: 'Moderat',
        youtubeUrl: 'https://www.youtube.com/watch?v=3NPxqXMZq7o',
        youtubeId: '3NPxqXMZq7o',
        durationSeconds: 345,
        thumbnailUrl: 'https://i.ytimg.com/vi/3NPxqXMZq7o/hqdefault.jpg',
      },
    ],
  },
  {
    id: 'code-and-deep-focus',
    title: 'Code & Deep Focus',
    mood: 'Deep Focus',
    subtitle: 'Deep flow-state electronica, mechanical rhythms, and glitch textures.',
    totalDurationLabel: 'Total 42m · 6 tracks',
    tracks: [
      {
        title: 'Deep Focus Flow',
        artist: 'Lofi Beats',
        youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
        youtubeId: '5qap5aO4i9A',
        durationSeconds: 310,
        thumbnailUrl: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
      },
      {
        title: 'Silhouettes',
        artist: 'Floating Points',
        youtubeUrl: 'https://www.youtube.com/watch?v=d6C0bNDqf3Y',
        youtubeId: 'd6C0bNDqf3Y',
        durationSeconds: 380,
        thumbnailUrl: 'https://i.ytimg.com/vi/d6C0bNDqf3Y/hqdefault.jpg',
      },
      {
        title: 'Recovery',
        artist: 'Rival Consoles',
        youtubeUrl: 'https://www.youtube.com/watch?v=fKopy74weus',
        youtubeId: 'fKopy74weus',
        durationSeconds: 360,
        thumbnailUrl: 'https://i.ytimg.com/vi/fKopy74weus/hqdefault.jpg',
      },
      {
        title: 'Dayvan Cowboy',
        artist: 'Boards of Canada',
        youtubeUrl: 'https://www.youtube.com/watch?v=Rk_sAHh9s08',
        youtubeId: 'Rk_sAHh9s08',
        durationSeconds: 300,
        thumbnailUrl: 'https://i.ytimg.com/vi/Rk_sAHh9s08/hqdefault.jpg',
      },
      {
        title: 'Awake',
        artist: 'Tycho',
        youtubeUrl: 'https://www.youtube.com/watch?v=V-_O7nl0Ii0',
        youtubeId: 'V-_O7nl0Ii0',
        durationSeconds: 283,
        thumbnailUrl: 'https://i.ytimg.com/vi/V-_O7nl0Ii0/hqdefault.jpg',
      },
      {
        title: 'Glue',
        artist: 'Bicep',
        youtubeUrl: 'https://www.youtube.com/watch?v=A7ZxRs45tTg',
        youtubeId: 'A7ZxRs45tTg',
        durationSeconds: 270,
        thumbnailUrl: 'https://i.ytimg.com/vi/A7ZxRs45tTg/hqdefault.jpg',
      },
    ],
  },
];
