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

    const {
      folder = "ecb-lightforce/players",
      purpose = "profile",
      transformation = ""
    } = await request.json().catch(() => ({}));
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

    const timestamp = String(Math.floor(Date.now() / 1000));
    const publicId = `${session.user.id}-${purpose}-${Date.now()}`;
    const signParams: Record<string, string> = { folder, public_id: publicId, timestamp };
    if (transformation && typeof transformation === "string") {
      signParams.transformation = transformation;
    }
    const signature = createCloudinarySignature(signParams, apiSecret);

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      publicId,
      signature,
      transformation: signParams.transformation || ""
    });
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.includes("Cloudinary env vars are missing")) {
      return NextResponse.json(
        {
          message: "Cloudinary is not configured on server.",
          code: "CLOUDINARY_ENV_MISSING"
        },
        { status: 500 }
      );
    }

    if (message.toLowerCase().includes("nextauth") || message.toLowerCase().includes("jwt")) {
      return NextResponse.json(
        {
          message: "Authentication configuration issue on server.",
          code: "AUTH_CONFIG_ERROR"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Could not generate upload signature.",
        code: "UPLOAD_SIGN_ERROR"
      },
      { status: 500 }
    );
  }
}
