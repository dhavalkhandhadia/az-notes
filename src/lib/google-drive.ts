import seed from "@/data/az-b13-seed.json";
import { NextRequest } from "next/server";

type SeedSession = {
  sessionNo: number;
  pdfTitle?: string;
  driveId?: string;
  notesUrl: string;
};

type SeedShape = {
  sessions: SeedSession[];
};

type DriveFileLookupResult = {
  driveId: string;
  notesUrl: string;
};

const GOOGLE_DRIVE_DOWNLOAD_URL =
  "https://drive.google.com/uc?export=download&id=";
const GOOGLE_DRIVE_USERCONTENT_URL =
  "https://drive.usercontent.google.com/download?export=download&confirm=t&id=";
const GOOGLE_DRIVE_FILES_API_URL = "https://www.googleapis.com/drive/v3/files";

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

const { sessions } = seed as SeedShape;

const sessionsByNumber = new Map(
  sessions.map((session) => [session.sessionNo, session])
);

function extractDriveIdFromUrl(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/i);
  return match?.[1] ?? null;
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function createDriveViewUrl(driveId: string) {
  return `https://drive.google.com/file/d/${encodeURIComponent(driveId)}/view`;
}

function getSeedSession(sessionNo: number) {
  return sessionsByNumber.get(sessionNo) ?? null;
}

function getFallbackDriveFile(session: SeedSession): DriveFileLookupResult | null {
  if (session.driveId) {
    return {
      driveId: session.driveId,
      notesUrl: createDriveViewUrl(session.driveId),
    };
  }

  const driveIdFromUrl = extractDriveIdFromUrl(session.notesUrl);

  if (!driveIdFromUrl) {
    return null;
  }

  return {
    driveId: driveIdFromUrl,
    notesUrl: session.notesUrl,
  };
}

async function lookupDriveFileByTitle(
  session: SeedSession
): Promise<DriveFileLookupResult | null> {
  if (!GOOGLE_DRIVE_FOLDER_ID || !GOOGLE_DRIVE_API_KEY || !session.pdfTitle) {
    return null;
  }

  const query = [
    `name = '${escapeDriveQueryValue(session.pdfTitle)}'`,
    `'${escapeDriveQueryValue(GOOGLE_DRIVE_FOLDER_ID)}' in parents`,
    "trashed = false",
    "mimeType = 'application/pdf'",
  ].join(" and ");

  const url = new URL(GOOGLE_DRIVE_FILES_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "files(id, name)");
  url.searchParams.set("orderBy", "modifiedTime desc, createdTime desc");
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("includeItemsFromAllDrives", "true");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("key", GOOGLE_DRIVE_API_KEY);

  const response = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    files?: Array<{ id?: string }>;
  };

  const driveId = payload.files?.[0]?.id;

  if (!driveId) {
    return null;
  }

  return {
    driveId,
    notesUrl: createDriveViewUrl(driveId),
  };
}

export async function resolveDriveFileForSession(sessionNo: number) {
  const session = getSeedSession(sessionNo);

  if (!session) {
    return null;
  }

  return (
    (await lookupDriveFileByTitle(session)) ?? getFallbackDriveFile(session)
  );
}

async function fetchPdfResponse(url: string, rangeHeader: string | null) {
  const response = await fetch(url, {
    cache: "force-cache",
    headers: {
      Accept: "application/pdf,text/html;q=0.9,*/*;q=0.8",
      ...(rangeHeader ? { Range: rangeHeader } : {}),
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const looksLikePdf =
    contentType.includes("application/pdf") ||
    contentType.includes("application/octet-stream");

  return { response, looksLikePdf };
}

export async function proxyDrivePdf(request: NextRequest, driveId: string) {
  const rangeHeader = request.headers.get("range");
  const primaryUrl = `${GOOGLE_DRIVE_DOWNLOAD_URL}${encodeURIComponent(driveId)}`;
  const fallbackUrl = `${GOOGLE_DRIVE_USERCONTENT_URL}${encodeURIComponent(driveId)}`;
  const primary = await fetchPdfResponse(primaryUrl, rangeHeader);

  const fallback =
    primary.response.ok && primary.looksLikePdf
      ? null
      : await fetchPdfResponse(fallbackUrl, rangeHeader);

  const upstreamResponse = fallback?.response ?? primary.response;
  const upstreamType = upstreamResponse.headers.get("content-type") ?? "";

  if (
    !upstreamResponse.ok ||
    (!upstreamType.includes("application/pdf") &&
      !upstreamType.includes("application/octet-stream"))
  ) {
    return new Response("Unable to load PDF from Google Drive.", {
      status: upstreamResponse.status,
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
  headers.set(
    "Accept-Ranges",
    upstreamResponse.headers.get("accept-ranges") ?? "bytes"
  );

  for (const headerName of [
    "content-disposition",
    "content-length",
    "content-range",
    "etag",
    "last-modified",
  ]) {
    const value = upstreamResponse.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}
