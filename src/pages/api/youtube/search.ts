import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      available: false,
      message: 'YouTube Data API key is not configured (YOUTUBE_API_KEY). Paste any direct YouTube URL or video ID to queue audio immediately, or browse the curated label catalog.',
      items: [],
    });
  }

  if (!q || typeof q !== 'string' || !q.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '10');
    url.searchParams.set('q', q.trim());
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      return res.status(response.status).json({
        available: false,
        error: errJson?.error?.message || 'YouTube search API returned an error',
        items: [],
      });
    }

    const data = await response.json();
    const items = (data.items || []).map((item: any) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      thumbnails: item.snippet?.thumbnails,
      publishedAt: item.snippet?.publishedAt,
    }));

    return res.status(200).json({
      available: true,
      items,
    });
  } catch (error: any) {
    return res.status(500).json({
      available: false,
      error: error?.message || 'Internal server error while searching YouTube',
      items: [],
    });
  }
}
