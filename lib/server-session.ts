/**
 * A marker unique to the current server process, changing whenever the app
 * is restarted (`npm run dev`/`next start`) but stable across normal
 * requests and client-side navigation within the same run.
 */
export const SERVER_SESSION_ID = String(process.pid);
