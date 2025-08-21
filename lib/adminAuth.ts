export function isAdmin(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true; // allow if not set (dev)
  const header = req.headers.get("x-admin-token") || "";
  return header === token;
}
