import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CtaAttrs = {
  heading: string;
  text: string;
  buttonText: string;
  href: string;
  visible: boolean;
};

const DEFAULTS: CtaAttrs = {
  heading: "Ready to prepare smarter?",
  text: "Learn, practice and improve with MedEu.Ai.",
  buttonText: "Try MedEuAi",
  href: "/auth",
  visible: true,
};

function CtaEditor({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as CtaAttrs;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CtaAttrs>(attrs);

  return (
    <NodeViewWrapper className="my-4">
      <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              CTA block {attrs.visible ? "" : "(hidden)"}
            </p>
            <p className="mt-1 font-semibold">{attrs.heading}</p>
            <p className="text-sm text-muted-foreground">{attrs.text}</p>
            <p className="mt-2 inline-flex rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              {attrs.buttonText}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title={attrs.visible ? "Hide block" : "Show block"}
              onClick={() => updateAttributes({ visible: !attrs.visible })}
            >
              {attrs.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Edit CTA"
              onClick={() => {
                setDraft(attrs);
                setOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Remove CTA"
              onClick={() => deleteNode()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit CTA block</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Heading</Label>
              <Input
                value={draft.heading}
                onChange={(e) => setDraft({ ...draft, heading: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Button text</Label>
                <Input
                  value={draft.buttonText}
                  onChange={(e) =>
                    setDraft({ ...draft, buttonText: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Button destination</Label>
                <Input
                  value={draft.href}
                  onChange={(e) => setDraft({ ...draft, href: e.target.value })}
                  placeholder="/auth"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                updateAttributes(draft);
                setOpen(false);
              }}
            >
              Save block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
}

/**
 * Editable CTA block stored inside the article HTML as
 * `<div data-cta ...>` so no extra table or schema field is needed.
 */
export const CtaBlock = Node.create({
  name: "ctaBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      heading: { default: DEFAULTS.heading },
      text: { default: DEFAULTS.text },
      buttonText: { default: DEFAULTS.buttonText },
      href: { default: DEFAULTS.href },
      visible: {
        default: true,
        parseHTML: (el) => el.getAttribute("data-visible") !== "false",
        renderHTML: (attrs) => ({
          "data-visible": attrs.visible === false ? "false" : "true",
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-cta]",
        getAttrs: (el) => {
          const e = el as HTMLElement;
          return {
            heading: e.getAttribute("data-heading") ?? DEFAULTS.heading,
            text: e.getAttribute("data-text") ?? DEFAULTS.text,
            buttonText: e.getAttribute("data-button") ?? DEFAULTS.buttonText,
            href: e.getAttribute("data-href") ?? DEFAULTS.href,
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const a = node.attrs as CtaAttrs;
    return [
      "div",
      mergeAttributes({
        "data-cta": "1",
        "data-heading": a.heading,
        "data-text": a.text,
        "data-button": a.buttonText,
        "data-href": a.href,
        "data-visible": a.visible === false ? "false" : "true",
        class: "article-cta",
      }),
      ["h3", {}, a.heading],
      ["p", {}, a.text],
      ["a", { href: a.href, class: "article-cta-btn" }, a.buttonText],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CtaEditor);
  },
});
