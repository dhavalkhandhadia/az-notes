import { proxyDrivePdf, resolveDriveFileForSession } from "@/lib/google-drive";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    sessionNo: string;
  }>;
};

export const revalidate = 3600;

export async function GET(request: NextRequest, context: RouteContext) {
  const { sessionNo } = await context.params;
  const parsedSessionNo = Number(sessionNo);

  if (!Number.isInteger(parsedSessionNo)) {
    return new Response("Invalid session number.", { status: 400 });
  }

  const file = await resolveDriveFileForSession(parsedSessionNo);

  if (!file) {
    return new Response("Unable to resolve notes PDF for this session.", {
      status: 404,
    });
  }

  return proxyDrivePdf(request, file.driveId);
}
