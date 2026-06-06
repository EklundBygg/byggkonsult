const SUPABASE_URL = "https://hedcfvuaqhddqvkrcajn.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZGNmdnVhcWhkZHF2a3JjYWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0Mjk5NTEsImV4cCI6MjA5MjAwNTk1MX0.92i5MvhPYrL_6TrtQqfYWBsIvQ87-gopJGTmuOKgxVg";

export default async function handler(_request, response) {
  try {
    const keepAliveResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?select=id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!keepAliveResponse.ok) {
      const message = await keepAliveResponse.text();
      return response.status(keepAliveResponse.status).json({
        ok: false,
        message,
      });
    }

    return response.status(200).json({
      ok: true,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
