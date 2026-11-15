import type { NextApiRequest, NextApiResponse } from 'next';
import dns from 'node:dns';
import { parseYouTubeVideoId, parseIso8601Duration } from '@/lib/utils';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, url } = req.query;
  const input = typeof id === 'string' ? id : typeof url === 'string' ? url : '';

  // Support YouTube playlist URLs: [?&]list=([a-zA-Z0-9_-]+)
  const playlistMatch = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const isPlaylist = Boolean(playlistMatch && (!input.includes('v=') || input.includes('/playlist')));

  if (isPlaylist && playlistMatch) {
    const playlistId = playlistMatch[1];
    let playlistTitle = 'YouTube Playlist';
    const tracks: Array<{
      youtubeId: string;
      url: string;
      title: string;
      durationSeconds: number;
      thumbnailUrl: string;
    }> = [];

    // 1. Fetch https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId} and parse <entry> blocks
    try {
      const feedRes = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (feedRes.ok) {
        const xml = await feedRes.text();
        const titleMatch = xml.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) playlistTitle = titleMatch[1].trim();

        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        while ((match = entryRegex.exec(xml)) !== null && tracks.length < 15) {
          const entry = match[1];
          const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const tMatch = entry.match(/<title>([^<]+)<\/title>/);
          if (idMatch && idMatch[1]) {
            const vId = idMatch[1].trim();
            tracks.push({
              youtubeId: vId,
              url: `https://www.youtube.com/watch?v=${vId}`,
              title: tMatch ? tMatch[1].trim() : 'YouTube Video',
              durationSeconds: 0,
              thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            });
          }
        }
      }
    } catch {}

    // 2. Fallback to scraping playlist page HTML if feed was unavailable or empty
    if (tracks.length === 0) {
      try {
        const htmlRes = await fetch(`https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const docTitle = html.match(/<title>([^<]+)<\/title>/);
          if (docTitle) {
            playlistTitle = docTitle[1].replace(/\s*-\s*YouTube\s*$/i, '').trim();
          }

          const dataMatch = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
          if (dataMatch) {
            try {
              const data = JSON.parse(dataMatch[1]);
              const seen = new Set<string>();

              const walk = (obj: any) => {
                if (!obj || typeof obj !== 'object' || tracks.length >= 15) return;

                if (obj.playlistVideoRenderer) {
                  const r = obj.playlistVideoRenderer;
                  const vId = r.videoId;
                  if (vId && !seen.has(vId)) {
                    seen.add(vId);
                    const title = r.title?.runs?.[0]?.text || r.title?.simpleText || 'YouTube Video';
                    const dur = parseInt(r.lengthSeconds || '0', 10) || 0;
                    tracks.push({
                      youtubeId: vId,
                      url: `https://www.youtube.com/watch?v=${vId}`,
                      title,
                      durationSeconds: dur,
                      thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
                    });
                  }
                }

                if (obj.lockupViewModel) {
                  const l = obj.lockupViewModel;
                  const title = l.metadata?.lockupMetadataViewModel?.title?.content;
                  const str = JSON.stringify(l);
                  const m = str.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
                  if (m && !seen.has(m[1])) {
                    seen.add(m[1]);
                    tracks.push({
                      youtubeId: m[1],
                      url: `https://www.youtube.com/watch?v=${m[1]}`,
                      title: title || 'YouTube Video',
                      durationSeconds: 0,
                      thumbnailUrl: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`,
                    });
                  }
                }

                for (const k of Object.keys(obj)) {
                  walk(obj[k]);
                }
              };

              walk(data);
            } catch {}
          }
        }
      } catch {}
    }

    if (tracks.length > 0) {
      return res.status(200).json({
        isPlaylist: true,
        playlistTitle: playlistTitle || 'YouTube Playlist',
        tracks: tracks.slice(0, 15),
      });
    }

    return res.status(404).json({
      valid: false,
      error: 'Could not find any accessible tracks in this YouTube playlist.',
    });
  }

  const videoId = parseYouTubeVideoId(input);

  if (!videoId) {
    return res.status(400).json({
      valid: false,
      error: 'Invalid YouTube link or ID. Please provide a valid 11-character video ID or link.',
    });
  }

  const defaultThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // 1. If YOUTUBE_API_KEY is available, use YouTube Data API v3 for exact duration & details
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      apiUrl.searchParams.set('part', 'snippet,contentDetails,status');
      apiUrl.searchParams.set('id', videoId);
      apiUrl.searchParams.set('key', apiKey);

      const response = await fetch(apiUrl.toString(), { signal: AbortSignal.timeout(6000) });
      if (response.ok) {
        const data = await response.json();
        const item = data.items?.[0];
        if (item) {
          if (item.status && item.status.embeddable === false) {
            return res.status(200).json({
              valid: false,
              error: 'This video owner does not allow embedding outside of YouTube.',
            });
          }

          // Parse ISO 8601 duration (e.g. PT4M13S, PT1H2M)
          const durationSeconds = parseIso8601Duration(item.contentDetails?.duration || '');

          return res.status(200).json({
            valid: true,
            videoId,
            title: item.snippet?.title || `YouTube Video (${videoId})`,
            artist: item.snippet?.channelTitle || 'YouTube Artist',
            thumbnail: item.snippet?.thumbnails?.high?.url || defaultThumbnail,
            durationSeconds,
            embeddable: null, // oEmbed confirms public metadata; the IFrame player reports embed restrictions.
          });
        }
      }
    } catch {
      // Continue to oEmbed fallback below
    }
  }

  // 2. Official Public YouTube oEmbed API (No API key required)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) });

    if (response.status === 404 || response.status === 401 || response.status === 403) {
      return res.status(200).json({
        valid: false,
        error: 'Video is unavailable, private, or has embedding restricted by YouTube.',
      });
    }

    if (response.ok) {
      const data = await response.json();

      // Retrieve accurate video duration from public YouTube watch page
      let durationSeconds = 0;
      try {
        const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(4000),
        });
        if (watchRes.ok) {
          const html = await watchRes.text();
          // 1. Try lengthSeconds in ytInitialPlayerResponse
          const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
          if (lenMatch && lenMatch[1]) {
            durationSeconds = parseInt(lenMatch[1], 10);
          }
          // 2. Try approxDurationMs
          if (!durationSeconds) {
            const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
            if (approxMatch && approxMatch[1]) {
              durationSeconds = Math.round(parseInt(approxMatch[1], 10) / 1000);
            }
          }
          // 3. Try itemprop="duration" content="PT..."
          if (!durationSeconds) {
            const itemMatch = html.match(/itemprop="duration" content="([^"]+)"/i);
            if (itemMatch && itemMatch[1]) {
              durationSeconds = parseIso8601Duration(itemMatch[1]);
            }
          }
        }
      } catch {
        // Non-blocking fallback: client player will sync duration on ready
      }

      return res.status(200).json({
        valid: true,
        videoId,
        title: data.title || `YouTube Video (${videoId})`,
        artist: data.author_name || 'YouTube Artist',
        thumbnail: data.thumbnail_url || defaultThumbnail,
        durationSeconds: durationSeconds > 0 ? durationSeconds : 0,
        embeddable: null, // oEmbed confirms public metadata; the IFrame player reports embed restrictions.
      });
    }
  } catch {
    // If external fetch fails, fail closed below instead of trusting an unverified ID.
  }

  // Do not queue an unverified ID when YouTube cannot confirm that it exists.
  return res.status(503).json({
    valid: false,
    embeddable: false,
    error: 'YouTube could not verify this video right now. Please try again shortly.',
  });
}
