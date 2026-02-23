import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCloudinarySignature, getCloudinaryConfig } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { folder = "ecb-lightforce/players", purpose = "profile" } = await request.json().catch(() => ({}));
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

    const timestamp = String(Math.floor(Date.now() / 1000));
    const publicId = `${session.user.id}-${purpose}-${Date.now()}`;
    const signParams = { folder, public_id: publicId, timestamp };
    const signature = createCloudinarySignature(signParams, apiSecret);

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      publicId,
      signature
    });
  } catch {
    return NextResponse.json({ message: "Could not generate upload signature." }, { status: 500 });
  }
}
