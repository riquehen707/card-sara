"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, LockKeyholeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminAuthGateProps = {
  children: ReactNode;
};

const adminSessionStorageKey = "cardapio-sara-admin-session";

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
        });
        const data = (await response.json()) as { authenticated?: boolean };

        if (mounted) {
          setIsAuthenticated(Boolean(data.authenticated));
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível entrar.");
      }

      window.sessionStorage.setItem(adminSessionStorageKey, "authenticated");
      setIsAuthenticated(true);
      setUser("");
      setPassword("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Não foi possível entrar."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return children;
  }

  if (isAuthenticated === null) {
    return (
      <main className="grid min-h-dvh place-items-center bg-secondary/40 px-4 py-8">
        <div className="text-sm text-muted-foreground">Carregando acesso...</div>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-secondary/40 px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-muted-foreground"
          >
            <Link href="/">
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Voltar ao cardápio
            </Link>
          </Button>
          <div className="flex size-11 items-center justify-center rounded-full border bg-background">
            <LockKeyholeIcon className="size-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle>Acesso administrativo</CardTitle>
            <CardDescription className="mt-2">
              Entre com o usuário e a senha do cardápio.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="admin-user">Usuário</Label>
              <Input
                id="admin-user"
                autoComplete="username"
                value={user}
                onChange={(event) => setUser(event.target.value)}
                placeholder="Digite o usuário"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-password">Senha</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite a senha"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
