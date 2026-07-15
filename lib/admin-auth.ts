import { cookies } from "next/headers";

const adminSessionCookieName = "cardapio-sara-admin-session";
const adminSessionCookieValue = "authenticated";
const sessionMaxAge = 60 * 60 * 8;

function shouldUseSecureCookie() {
  return process.env.VERCEL === "1";
}

export function isValidAdminLogin(user: string, password: string) {
  const adminUser = process.env.ADMIN_USER ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";

  return user.trim() === adminUser && password === adminPassword;
}

export async function hasAdminSession() {
  const cookieStore = await cookies();

  return (
    cookieStore.get(adminSessionCookieName)?.value === adminSessionCookieValue
  );
}

export async function setAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: adminSessionCookieName,
    value: adminSessionCookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: sessionMaxAge,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: adminSessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0,
  });
}
