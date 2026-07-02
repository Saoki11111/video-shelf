const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ views: {} });

  const { results = [] } = await env.DB
    .prepare("SELECT video_id, view_count FROM video_views ORDER BY view_count DESC")
    .all();
  const views = Object.fromEntries(results.map(({ video_id, view_count }) => [
    video_id,
    Number(view_count)
  ]));

  return json({ views });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.videoId !== "string" || !ID_PATTERN.test(body.videoId)) {
    return json({ error: "Invalid videoId" }, { status: 400 });
  }

  await env.DB.prepare(`
    INSERT INTO video_views (video_id, view_count, updated_at)
    VALUES (?1, 1, datetime('now'))
    ON CONFLICT(video_id) DO UPDATE SET
      view_count = view_count + 1,
      updated_at = datetime('now')
  `).bind(body.videoId).run();

  return json({ ok: true }, { status: 201 });
}

