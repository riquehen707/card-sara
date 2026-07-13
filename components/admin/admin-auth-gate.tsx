"use client";

import { FormEvent, ReactNode, useState } from "react";
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
const adminUser = "admin";
const adminAccessKey = "admin";

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.sessionStorage.getItem(adminSessionStorageKey) === "authenticated"
    );
  });
  const [user, setUser] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (user.trim() !== adminUser || accessKey !== adminAccessKey) {
      setError("Usuário ou chave de acesso inválidos.");
      return;
    }

    window.sessionStorage.setItem(adminSessionStorageKey, "authenticated");
    setIsAuthenticated(true);
    setError("");
  }

  if (isAuthenticated) {
    return children;
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
              Entre com o usuário e a chave de acesso do cardápio.
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
                placeholder="admin"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-access-key">Chave de acesso</Label>
              <Input
                id="admin-access-key"
                type="password"
                autoComplete="current-password"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                placeholder="admin"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
