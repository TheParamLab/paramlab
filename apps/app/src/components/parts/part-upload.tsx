"use client";

import { Button, cn, Input, Label, toast } from "@acme/ui";
import {
  estimateMassFromVolume,
  MATERIALS,
  type MaterialId,
  PART_FILE_MAX_BYTES,
  PART_MASS,
  partFormatFromFileName,
} from "@acme/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileBox, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { formatFileSize } from "~/lib/format";
import {
  parseBinaryStl,
  renderStlPreview,
  STL_PARSE_MAX_BYTES,
} from "~/lib/stl";
import { client, orpc } from "~/orpc/react";
import { MaterialSelect } from "./material-select";

interface Draft {
  file: File;
  size: [number, number, number] | null;
  volumeCm3: number | null;
  preview: Blob | null;
  previewUrl: string | null;
}

async function putObject(url: string, body: Blob) {
  const response = await fetch(url, {
    method: "PUT",
    body,
    headers: { "Content-Type": "application/octet-stream" },
  });
  if (!response.ok) throw new Error("Не удалось загрузить файл в хранилище");
}

/** Загрузка STL / STEP / 3MF в библиотеку: файл → параметры → сохранение. */
export function PartUpload() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState("");
  const [materialId, setMaterialId] = useState<MaterialId>("petg");
  const [mass, setMass] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  /** Номер последнего выбора файла: разбор старого не должен его затереть. */
  const selection = useRef(0);

  function reset() {
    selection.current += 1;
    if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
    setDraft(null);
    setName("");
    setMass("");
    setFileError(null);
  }

  async function handleFile(file: File) {
    const format = partFormatFromFileName(file.name);
    if (!format) {
      setFileError("Поддерживаются файлы STL, STEP и 3MF.");
      return;
    }
    if (file.size > PART_FILE_MAX_BYTES) {
      setFileError("Файл больше 100 МБ. Упростите модель или напишите нам.");
      return;
    }
    setFileError(null);

    selection.current += 1;
    const current = selection.current;
    const mesh =
      format === "stl" && file.size <= STL_PARSE_MAX_BYTES
        ? parseBinaryStl(await file.arrayBuffer())
        : null;
    const preview = mesh ? await renderStlPreview(mesh) : null;
    // Пока шёл разбор, пользователь выбрал другой файл или убрал этот.
    if (current !== selection.current) return;
    if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);

    setDraft({
      file,
      size: mesh?.size ?? null,
      volumeCm3: mesh?.volumeCm3 ?? null,
      preview,
      previewUrl: preview ? URL.createObjectURL(preview) : null,
    });
    setName(file.name.replace(/\.[^.]+$/, "").slice(0, 120));
    setMass(
      mesh ? String(estimateMassFromVolume(mesh.volumeCm3, materialId)) : "",
    );
  }

  function changeMaterial(next: MaterialId) {
    setMaterialId(next);
    // Масса зависит от плотности пластика — пересчитываем по объему модели.
    if (draft?.volumeCm3 != null) {
      setMass(String(estimateMassFromVolume(draft.volumeCm3, next)));
    }
  }

  const massGrams = Math.round(Number(mass));
  const massValid =
    mass !== "" && massGrams >= PART_MASS.min && massGrams <= PART_MASS.max;

  const save = useMutation({
    mutationFn: async (current: Draft) => {
      const upload = await client.part.requestUpload({
        fileName: current.file.name,
        fileSize: current.file.size,
        previewSize: current.preview?.size,
      });
      await putObject(upload.file.url, current.file);
      if (upload.preview && current.preview) {
        await putObject(upload.preview.url, current.preview);
      }
      return client.part.create({
        name: name.trim(),
        fileKey: upload.file.key,
        fileName: current.file.name,
        fileSize: current.file.size,
        previewKey: upload.preview?.key ?? null,
        size: current.size,
        volumeCm3: current.volumeCm3,
        massGrams,
        materialId,
      });
    },
    onSuccess: async () => {
      toast.success("Деталь сохранена в библиотеке");
      reset();
      await queryClient.invalidateQueries({ queryKey: orpc.part.key() });
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось сохранить деталь");
    },
  });

  if (!draft) {
    return (
      <div>
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void handleFile(file);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors has-focus-visible:border-ring",
            dragging
              ? "border-primary bg-primary/5"
              : "hover:border-foreground/40 hover:bg-muted/50",
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <span className="text-sm font-medium">
            Перетащите 3D-модель или нажмите, чтобы выбрать файл
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            .stl · .step · .3mf · до 100 МБ
          </span>
          <input
            type="file"
            accept=".stl,.step,.stp,.3mf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </label>
        {fileError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {fileError}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[10rem_1fr]"
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim() && massValid) save.mutate(draft);
      }}
    >
      <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
        {draft.previewUrl ? (
          // biome-ignore lint/performance/noImgElement: локальный blob-URL
          <img
            src={draft.previewUrl}
            alt={`Превью модели ${draft.file.name}`}
            className="size-full object-contain"
          />
        ) : (
          <FileBox className="size-10 text-muted-foreground" />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{draft.file.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {formatFileSize(draft.file.size)}
              {draft.size
                ? ` · ${draft.size.map((v) => Math.round(v)).join(" × ")} мм`
                : " · габариты уточним после проверки файла"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Убрать файл"
            onClick={reset}
            disabled={save.isPending}
          >
            <X />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="part-name">Название детали</Label>
            <Input
              id="part-name"
              value={name}
              maxLength={120}
              required
              placeholder="Например, «Втулка рулевой рейки»"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="part-material">Материал</Label>
            <MaterialSelect
              id="part-material"
              value={materialId}
              onChange={changeMaterial}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="part-mass">Расчётный вес, г</Label>
            <Input
              id="part-mass"
              type="number"
              inputMode="numeric"
              min={PART_MASS.min}
              max={PART_MASS.max}
              required
              value={mass}
              aria-describedby="part-mass-hint"
              onChange={(event) => setMass(event.target.value)}
            />
            <p id="part-mass-hint" className="text-xs text-muted-foreground">
              {draft.volumeCm3 != null
                ? `Посчитан по объёму модели для ${MATERIALS.find((m) => m.id === materialId)?.code}.`
                : "Для этого формата вес не считается автоматически — укажите примерный."}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-fit"
          disabled={save.isPending || !name.trim() || !massValid}
        >
          {save.isPending ? "Сохраняем…" : "Сохранить в библиотеку"}
        </Button>
      </div>
    </form>
  );
}
