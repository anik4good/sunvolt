"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import { Bold, Heading2, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Loader2, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadProductImage } from "@/app/admin/(panel)/products/actions";
import { compressImage, describeCompression } from "@/lib/compress-image";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(value: string): string {
  if (!value.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.split("\n").map((line) => escapeHtml(line.trim())).filter(Boolean).join("<br />")}</p>`)
    .join("");
}

export function ProductDescriptionEditor({ initialValue }: { initialValue?: string | null }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [compressNote, setCompressNote] = useState<string | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Placeholder.configure({ placeholder: "Paste your product description here…" }),
    ],
    content: textToHtml(initialValue ?? ""),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-52 px-3 py-3 outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const form = editor.view.dom.closest("form");
    if (!form) return;
    const input = form.querySelector<HTMLInputElement>('input[name="description"]');
    if (!input) return;
    const sync = () => {
      input.value = editor.getHTML() === "<p></p>" ? "" : editor.getHTML();
    };
    sync();
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor]);

  const insertUploadedImages = async (files: File[]) => {
    if (!editor || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    const notes: string[] = [];
    try {
      for (const file of files) {
        const compressed = await compressImage(file);
        notes.push(describeCompression(file.name, compressed));
        const result = await uploadProductImage(compressed.file);
        if (result.error || !result.path) {
          setUploadError(result.error ?? "Could not upload image.");
          continue;
        }
        editor.chain().focus().setImage({ src: result.path }).run();
      }
      setCompressNote(notes.length > 0 ? notes.join("  ·  ") : null);
    } catch {
      // Server-action transport failures (e.g. body limit) throw instead
      // of returning { error }.
      setUploadError("Upload failed — the file may be too large.");
      setCompressNote(notes.length > 0 ? notes.join("  ·  ") : null);
    } finally {
      setUploading(false);
    }
  };

  if (!editor) {
    return <div className="min-h-52 rounded-md border bg-card" />;
  }

  return (
    <div className="rounded-md border bg-card">
      <input type="hidden" name="description" defaultValue={initialValue ?? ""} />
      <div className="flex flex-wrap gap-1 border-b p-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold"><Bold className="size-4" /></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic"><Italic className="size-4" /></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading"><Heading2 className="size-4" /></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list"><List className="size-4" /></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list"><ListOrdered className="size-4" /></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} aria-label="Undo"><Undo2 className="size-4" /></Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} aria-label="Redo"><Redo2 className="size-4" /></Button>
        <label className="inline-flex">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void insertUploadedImages(Array.from(event.target.files));
              event.target.value = "";
            }}
          />
          <Button type="button" variant="ghost" size="sm" asChild disabled={uploading}>
            <span>{uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}<span className="sr-only">Insert image</span></span>
          </Button>
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={() => {
          const url = window.prompt("Image URL");
          if (url && /^https?:\/\//i.test(url)) editor.chain().focus().setImage({ src: url }).run();
        }} aria-label="Insert image URL"><LinkIcon className="size-4" /></Button>
      </div>
      <EditorContent
        editor={editor}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"));
          if (files.length > 0) {
            event.preventDefault();
            void insertUploadedImages(files);
          }
        }}
      />
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
        Paste formatted text or images directly. Images are saved with the product.
      </p>
      {uploadError ? <p className="px-3 pb-2 text-xs font-medium text-destructive">{uploadError}</p> : null}
      {compressNote ? (
        <p className="px-3 pb-2 text-xs text-leaf">{compressNote}</p>
      ) : null}
    </div>
  );
}
