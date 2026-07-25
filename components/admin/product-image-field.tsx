"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  CameraIcon,
  ImagePlusIcon,
  LoaderCircleIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ProductImageFieldProps = {
  imageUrl: string;
  imageAlt: string;
  productSlug: string;
  disabled?: boolean;
  onChange: (imageUrl: string) => void;
};

const placeholderImageUrl = "/mock/placeholder.svg";
const maximumImageDimension = 1600;
const maximumSourceFileSize = 25 * 1024 * 1024;

async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem.");
  }

  if (file.type === "image/svg+xml") {
    throw new Error("Use uma foto, não um arquivo SVG.");
  }

  if (file.size > maximumSourceFileSize) {
    throw new Error("A foto original deve ter no máximo 25 MB.");
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    throw new Error(
      "Não foi possível abrir essa foto. Tente usar JPG, PNG, WebP ou tirar uma nova foto."
    );
  }
  const scale = Math.min(
    1,
    maximumImageDimension / Math.max(bitmap.width, bitmap.height)
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Não foi possível preparar a imagem.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.84)
  );

  if (!blob) {
    throw new Error("Não foi possível preparar a imagem.");
  }

  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, {
    type: "image/jpeg",
  });
}

export function ProductImageField({
  imageUrl,
  imageAlt,
  productSlug,
  disabled,
  onChange,
}: ProductImageFieldProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");

    try {
      const optimizedFile = await optimizeImage(file);
      const formData = new FormData();
      formData.append("file", optimizedFile);
      formData.append("slug", productSlug || "produto");

      const response = await fetch("/api/admin/images", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { imageUrl?: string; error?: string };

      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error ?? "Não foi possível enviar a imagem.");
      }

      onChange(data.imageUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a imagem."
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) void uploadImage(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (disabled || uploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file) void uploadImage(file);
  }

  return (
    <div className="grid gap-3">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-secondary/40"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <Image
          src={imageUrl || placeholderImageUrl}
          alt={imageAlt || "Foto do produto"}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover"
          unoptimized
        />
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-background/75">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LoaderCircleIcon className="size-5 animate-spin" />
              Preparando foto...
            </div>
          </div>
        )}
        {!uploading && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden items-center justify-center gap-2 rounded-lg bg-background/90 px-3 py-2 text-xs font-medium shadow-sm sm:flex">
            <UploadIcon className="size-4" />
            Arraste uma foto aqui
          </div>
        )}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileInput}
        disabled={disabled || uploading}
        aria-label="Tirar foto do produto"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileInput}
        disabled={disabled || uploading}
        aria-label="Escolher foto da galeria ou dos arquivos"
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <CameraIcon className="size-4" />
          Tirar foto
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <ImagePlusIcon className="size-4" />
          Galeria / arquivo
        </Button>
      </div>

      {imageUrl !== placeholderImageUrl && (
        <Button
          type="button"
          variant="ghost"
          className="justify-self-start text-muted-foreground"
          onClick={() => onChange(placeholderImageUrl)}
          disabled={disabled || uploading}
        >
          <Trash2Icon className="size-4" />
          Remover foto
        </Button>
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        Ao tocar em “Tirar foto”, permita o acesso à câmera quando o navegador
        solicitar. Se preferir, escolha uma imagem da galeria ou dos arquivos.
        No computador, também é possível arrastar a foto. A imagem é reduzida
        antes do envio.
      </p>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
