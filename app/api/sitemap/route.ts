import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = "https://www.social-flow.pl";
  // Tutaj możesz dodać dynamiczne pobieranie ścieżek np. z bazy danych lub plików
  const staticPaths = [
    "/",
    "/dashboard",
    "/privacy-policy",
    "/terms-of-service",
    "/success",
  ];

  const urls = staticPaths
    .map(
      (path) =>
        `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
