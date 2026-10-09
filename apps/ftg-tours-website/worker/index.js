export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS：允許 ftgtours.esggo.co 同源 POST
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://ftgtours.esggo.co',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      try {
        const data = await request.json();
        const stmt = env.DB.prepare(
          `INSERT INTO contact_inquiries
           (company, contact_name, email, phone, participants, activity_type, preferred_date, message, ip, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
        );
        const res = await stmt.bind(
          data.company || null,
          data.contact_name || null,
          data.email || null,
          data.phone || null,
          data.participants ? parseInt(data.participants) || null : null,
          data.activity_type || null,
          data.preferred_date || null,
          data.message || null,
          request.headers.get('cf-connecting-ip') || null
        ).run();

        return new Response(JSON.stringify({ ok: true, id: res.meta.last_row_id }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
