# NOCTURNE deployment

## Run with Docker Compose

Install Docker Desktop (or Docker Engine with the Compose plugin), then from the project folder run:

```sh
docker compose up --build -d
```

Open `http://localhost:3000`. To stop it, run `docker compose down`. Room state and uploaded room audio are kept in the `nocturne-data` volume across container restarts.

## Optional YouTube search

Pasting YouTube links or IDs works without credentials. Live catalog search needs a YouTube Data API v3 key. Set `YOUTUBE_API_KEY` in the deployment platform's private environment-variable settings before starting the app. Do not commit a real key to the repository.

## Hosting requirements and current limits

- Use one long-running Node.js process/container with writable persistent storage mounted at `/app/.data`.
- The room state and live updates are held by that process. A multi-instance/serverless deployment needs shared database, file storage, and realtime coordination first.
- Put the app behind HTTPS for public use. The reverse proxy must support long-lived Server-Sent Events connections for room updates and allow audio uploads up to 25 MB.
- Rooms currently have link-based access. Sign-in, private/invite-only rooms, moderation, and production abuse controls are not included.
- YouTube playback is provided by the official embedded player, subject to YouTube availability and embed permissions. Local files only reach other listeners after the user chooses to share them with the room.

## Manual Node.js run

With Node.js 20 and npm installed, run `npm ci`, `npm run build`, then `npm run start`. Keep `.data` persistent and writable between restarts.
