import { NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Exchanges a Google OAuth authorization code for an id_token.
 * Used by the mobile app when the in-app browser strips the fragment (#id_token=...).
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env (same Web client as Firebase Google sign-in).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, redirect_uri } = body as { code?: string; redirect_uri?: string };

    if (!code || !redirect_uri) {
      return NextResponse.json(
        { error: "Missing code or redirect_uri" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Server missing Google OAuth config" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await tokenRes.json().catch(() => ({}));

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: data.error_description || data.error || "Token exchange failed" },
        { status: tokenRes.status }
      );
    }

    const idToken = data.id_token;
    if (!idToken) {
      return NextResponse.json(
        { error: "No id_token in response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ id_token: idToken });
  } catch (e) {
    return NextResponse.json(
      { error: "Exchange failed" },
      { status: 500 }
    );
  }
}
