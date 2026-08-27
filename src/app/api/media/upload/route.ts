import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_EXTENSIONS = [".mp3", ".m4a", ".wav", ".ogg", ".aac"];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Same admin-only check used everywhere else in the admin panel.
        // Runs before a token is issued, so an unauthenticated or non-admin
        // request never receives a usable upload token at all.
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
          throw new Error("Unauthorized");
        }

        const ext = pathname.slice(pathname.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          throw new Error(
            "Only audio files are allowed (mp3, m4a, wav, ogg, aac)",
          );
        }

        return {
          allowedContentTypes: [
            "audio/mpeg",
            "audio/mp4",
            "audio/x-m4a",
            "audio/wav",
            "audio/ogg",
            "audio/aac",
          ],
          addRandomSuffix: true,
          // Generous ceiling for a full lesson/sermon recording — well
          // beyond what the old ~4.5MB server-body limit ever allowed.
          maximumSizeInBytes: 500 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // Nothing needed here — the browser calls POST /api/media with
        // the resulting blob URL right after upload() resolves, reusing
        // all of the existing record-creation logic unchanged.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
