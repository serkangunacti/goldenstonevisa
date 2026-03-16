import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Kullanıcıları listele
export async function GET() {
  try {
    const listResult = await adminAuth.listUsers(1000);
    const users = listResult.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || "",
      disabled: u.disabled,
      createdAt: u.metadata.creationTime,
      lastLogin: u.metadata.lastSignInTime,
    }));
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Kullanıcılar alınamadı" }, { status: 500 });
  }
}

// Yeni kullanıcı oluştur
export async function POST(req: Request) {
  try {
    const { email, password, displayName } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "E-posta ve şifre zorunlu" }, { status: 400 });
    }
    const user = await adminAuth.createUser({ email, password, displayName });
    return NextResponse.json({ uid: user.uid, email: user.email });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Kullanıcı oluşturulamadı";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Kullanıcı sil / güncelle
export async function DELETE(req: Request) {
  try {
    const { uid } = await req.json();
    await adminAuth.deleteUser(uid);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Kullanıcı silinemedi" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { uid, email, password, displayName, disabled } = await req.json();
    await adminAuth.updateUser(uid, {
      ...(email && { email }),
      ...(password && { password }),
      ...(displayName !== undefined && { displayName }),
      ...(disabled !== undefined && { disabled }),
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Kullanıcı güncellenemedi" }, { status: 500 });
  }
}
