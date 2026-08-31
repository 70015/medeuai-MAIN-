import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Link2Off,
  ImagePlus,
  Megaphone,
  Table as TableIcon,
  Pilcrow,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MediaDialog } from "@/components/admin/media-dialog";
import { LinkDialog } from "@/components/admin/link-dialog";
import { CtaBlock } from "@/components/admin/cta-block";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      TableKit.configure({ table: { resizable: false } }),
      CtaBlock,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "article-content min-h-[320px] w-full max-w-none px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });


  // Load server content once it arrives (e.g. editing an existing article).
  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[380px] rounded-md border border-border/60 bg-card/40" />
    );
  }

  const Tool = ({
    icon: Icon,
    label,
    active,
    onClick,
  }: {
    icon: typeof Bold;
    label: string;
    active?: boolean;
    onClick: () => void;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("h-8 w-8", active && "bg-secondary text-foreground")}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-card/40">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-2 py-1.5">
        <Tool
          icon={Pilcrow}
          label="Paragraph"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        />
        <Tool
          icon={Heading1}
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <Tool
          icon={Heading2}
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <Tool
          icon={Heading3}
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <span className="mx-1 h-5 w-px bg-border/60" />
        <Tool
          icon={Bold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Tool
          icon={Italic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <span className="mx-1 h-5 w-px bg-border/60" />
        <Tool
          icon={List}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Tool
          icon={ListOrdered}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <Tool
          icon={Quote}
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <span className="mx-1 h-5 w-px bg-border/60" />
        <Tool
          icon={Link2}
          label="Add link"
          active={editor.isActive("link")}
          onClick={() => setLinkOpen(true)}
        />
        <Tool
          icon={Link2Off}
          label="Remove link"
          onClick={() => editor.chain().focus().unsetLink().run()}
        />
        <Tool
          icon={ImagePlus}
          label="Insert image"
          onClick={() => setMediaOpen(true)}
        />
        <Tool
          icon={Megaphone}
          label="Insert CTA block"
          onClick={() =>
            editor.chain().focus().insertContent({ type: "ctaBlock" }).run()
          }
        />

        <Tool
          icon={TableIcon}
          label="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        />
        <span className="mx-1 h-5 w-px bg-border/60" />
        <Tool
          icon={Undo2}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <Tool
          icon={Redo2}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>
      <div className="max-h-[65vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <MediaDialog
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onPick={({ src, alt, caption }) => {
          const chain = editor.chain().focus();
          chain.setImage({ src, alt }).run();
          if (caption) {
            editor
              .chain()
              .focus()
              .insertContent(`<p><em>${caption}</em></p>`)
              .run();
          }
        }}
      />
      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        initialHref={editor.getAttributes("link").href as string | undefined}
        onPick={(href) => {
          if (!href) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const external = /^https?:\/\//i.test(href);
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({
              href,
              ...(external ? { target: "_blank", rel: "noopener noreferrer" } : { target: null }),
            })
            .run();
        }}
      />
    </div>
  );

}
