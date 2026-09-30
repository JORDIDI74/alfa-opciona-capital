// Railway pings this after every deploy before routing traffic to the new
// container (see `healthcheckPath` in railway.json).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", uptime: Math.round(process.uptime()) },
    { headers: { "cache-control": "no-store" } },
  );
}
