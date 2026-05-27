# Deploy TempoTrack on Easypanel

TempoTrack is a fullstack Node.js app: React frontend, Express backend, and SQLite database. Deploy it in Easypanel as a Docker app, not as a static site.

## Easypanel setup

1. Push this project to a Git repository.
2. In Easypanel, create a new app.
3. Choose **Git repository** as the source.
4. Choose **Dockerfile** as the build method.
5. Set the exposed port to `5000`.
6. Add a persistent volume:
   - Mount path: `/data`
   - This stores `/data/data.db`, which contains users, sessions, and tasks.
7. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `DATABASE_PATH=/data/data.db`
8. Deploy.

## Demo login

After first boot, the app creates a demo account:

- Email: `demo@tempotrack.app`
- Password: `demo123`

New registered users get their own private workspace and starter tasks.

## Backups

Back up the Easypanel volume regularly. The important file is:

```text
/data/data.db
```

SQLite may also create temporary WAL files while the app is running:

```text
/data/data.db-wal
/data/data.db-shm
```

For best safety, stop the app or use a SQLite-aware backup command before copying the database.

## Notes

- This app uses bearer tokens stored in React memory only. Users will need to log in again after a browser refresh. A production improvement would be secure HTTP-only cookie sessions.
- SQLite is fine for a small personal SaaS or early MVP. For many active users, migrate to PostgreSQL.
- Easypanel should provide HTTPS through its domain/proxy settings.
