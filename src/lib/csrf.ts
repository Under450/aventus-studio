export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin || !appUrl) return true;
  return origin === appUrl || origin === new URL(appUrl).origin;
}
