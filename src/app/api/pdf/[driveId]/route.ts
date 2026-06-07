import { proxyDrivePdf } from "@/lib/google-drive";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    driveId: string;
  }>;
};

export const revalidate = 3600;

export async function GET(request: NextRequest, context: RouteContext) {
  const { driveId } = await context.params;

  if (!driveId) {
    return new Response("Missing Drive file id.", { status: 400 });
  }

  return proxyDrivePdf(request, driveId);
}
