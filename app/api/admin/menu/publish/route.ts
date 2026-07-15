import { NextResponse } from "next/server";
import { z } from "zod";

import { hasAdminSession } from "@/lib/admin-auth";
import { menuDataSchema } from "@/types/menu";

const publishRequestSchema = z.object({
  menuData: menuDataSchema,
});

type GitHubContentResponse = {
  sha?: string;
  message?: string;
};

const githubApiVersion = "2022-11-28";
const defaultGitHubOwner = "riquehen707";
const defaultGitHubRepo = "card-sara";
const defaultGitHubBranch = "master";
const defaultGitHubMenuPath = "data/menu.json";

function getGitHubToken() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error(
      "Publicação indisponível: configuração interna do GitHub ausente."
    );
  }

  return token;
}

function createJsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return createJsonResponse(
      { error: "Sessão administrativa expirada. Entre novamente." },
      401
    );
  }

  const parsedRequest = publishRequestSchema.safeParse(await request.json());

  if (!parsedRequest.success) {
    return createJsonResponse(
      {
        error: "Dados inválidos.",
        issues: parsedRequest.error.flatten(),
      },
      400
    );
  }

  try {
    const owner = process.env.GITHUB_OWNER ?? defaultGitHubOwner;
    const repo = process.env.GITHUB_REPO ?? defaultGitHubRepo;
    const token = getGitHubToken();
    const branch = process.env.GITHUB_BRANCH ?? defaultGitHubBranch;
    const filePath = process.env.GITHUB_MENU_PATH ?? defaultGitHubMenuPath;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replaceAll("%2F", "/")}`;

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": githubApiVersion,
    };

    const currentFileResponse = await fetch(`${apiUrl}?ref=${branch}`, {
      headers,
      cache: "no-store",
    });

    if (!currentFileResponse.ok) {
      return createJsonResponse(
        {
          error: "Não foi possível localizar o JSON atual no GitHub.",
          status: currentFileResponse.status,
        },
        502
      );
    }

    const currentFile =
      (await currentFileResponse.json()) as GitHubContentResponse;

    if (!currentFile.sha) {
      return createJsonResponse(
        { error: "Resposta do GitHub não incluiu o SHA do arquivo." },
        502
      );
    }

    const content = Buffer.from(
      `${JSON.stringify(parsedRequest.data.menuData, null, 2)}\n`,
      "utf8"
    ).toString("base64");

    const updateResponse = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Atualiza cardápio",
        content,
        sha: currentFile.sha,
        branch,
      }),
    });

    const updateData = (await updateResponse.json()) as GitHubContentResponse;

    if (!updateResponse.ok) {
      return createJsonResponse(
        {
          error: updateData.message ?? "GitHub recusou a atualização.",
          status: updateResponse.status,
        },
        502
      );
    }

    return createJsonResponse({
      ok: true,
      message: "Cardápio publicado. A Vercel deve iniciar um novo deploy.",
    });
  } catch (error) {
    return createJsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao publicar alterações.",
      },
      500
    );
  }
}
