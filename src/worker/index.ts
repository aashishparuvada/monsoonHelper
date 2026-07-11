import { Hono } from 'hono';
import { assistantRoutes } from './routes/assistant';
import { locationRoutes } from './routes/location';
import { planRoutes } from './routes/plan';
import type { Env } from './shared';

const app = new Hono<{ Bindings: Env }>();

app.route('/', locationRoutes);
app.route('/', planRoutes);
app.route('/', assistantRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Something went wrong. Please try again.' }, 500);
});

export default app;
