import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin-auth";

const maximumFileSize = 6 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const githubApiVersion = "2022-11-28";
const defaultGitHubOwner = "riquehen707";
const defaultGitHubRepo = "card-sara";
const defaultGitHubBranch = "master";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function safeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "produto";
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return json({ error: "Sessão administrativa expirada. Entre novamente." }, 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return json({ error: "Nenhuma imagem foi recebida." }, 400);
    }

    if (!allowedTypes.has(file.type)) {
      return json({ error: "Use uma foto JPG, PNG ou WebP." }, 415);
    }

    if (file.size > maximumFileSize) {
      return json({ error: "A foto deve ter no máximo 6 MB." }, 413);
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return json({ error: "Envio de fotos indisponível: configuração do GitHub ausente." }, 500);
    }

    const owner = process.env.GITHUB_OWNER ?? defaultGitHubOwner;
    const repo = process.env.GITHUB_REPO ?? defaultGitHubRepo;
    const branch = process.env.GITHUB_BRANCH ?? defaultGitHubBranch;
    const slug = safeSlug(String(formData.get("slug") ?? "produto"));
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `${slug}-${Date.now()}.${extension}`;
    const filePath = `public/products/${filename}`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const content = Buffer.from(await file.arrayBuffer()).toString("base64");

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": githubApiVersion,
      },
      body: JSON.stringify({
        message: `Adiciona foto de ${slug}`,
        content,
        branch,
      }),
    });
    const responseData = (await response.json()) as { message?: string };

    if (!response.ok) {
      return json({ error: responseData.message ?? "GitHub recusou o envio da foto." }, 502);
    }

    const imageUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    return json({ imageUrl });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Erro inesperado ao enviar a foto." },
      500
    );
  }
}
