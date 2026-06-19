// functions/api/data.ts
export interface WordnetData {
  nodes: { id: number; word: string; x: number; y: number; note: string }[];
  edges: { from: number; to: number }[];
  nextId: number;
  camera: { x: number; y: number; scale: number };
}

// ✅ GET /api/data → 读取
export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context;
  const stmt = env.DB.prepare('SELECT value FROM data WHERE id = ?').bind('main');
  const result = await stmt.first<{ value: string }>();
  
  if (!result) {
    return new Response(JSON.stringify({ 
      nodes: [], edges: [], nextId: 0, camera: { x: 0, y: 0, scale: 1 } 
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const data = JSON.parse(result.value) as WordnetData;
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'parse_failed' }), { status: 500 });
  }
};

// ✅ POST /api/data → 写入
export const onRequestPost: PagesFunction = async (context) => {
  const { env, request } = context;
  const body = await request.json() as WordnetData;

  // 验证结构（简略）
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return new Response(JSON.stringify({ error: 'invalid_data' }), { status: 400 });
  }

  const stmt = env.DB.prepare('INSERT OR REPLACE INTO data (id, value) VALUES (?, ?)')
    .bind('main', JSON.stringify(body));
  await stmt.run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};