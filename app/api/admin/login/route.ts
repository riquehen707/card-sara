import { NextResponse } from "next/server";
import { z } from "zod";

import { isValidAdminLogin, setAdminSession } from "@/lib/admin-auth";

const loginSchema = z.object({
  user: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsedRequest = loginSchema.safeParse(await request.json());

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Informe usuário e senha." },
      { status: 400 }
    );
  }

  if (
    !isValidAdminLogin(
      parsedRequest.data.user,
      parsedRequest.data.password
    )
  ) {
    return NextResponse.json(
      { error: "Usuário ou senha inválidos." },
      { status: 401 }
    );
  }

  await setAdminSession();

  return NextResponse.json({ ok: true });
}
