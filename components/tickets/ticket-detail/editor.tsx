"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Editor, EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader,
  Redo,
  Send,
  Sparkles,
  Strikethrough,
  Undo,
  Unlink,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditorProps {
  ticketId: string;
  placeholder?: string;
}

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (isLinkDialogOpen && editor) {
      const existingUrl = editor.getAttributes("link").href;
      setLinkUrl(existingUrl || "");
    } else {
      setLinkUrl(""); // Clear on close
    }
  }, [isLinkDialogOpen, editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    setIsLinkDialogOpen(false);
  }, [editor, linkUrl]);

  const handleRemoveLink = useCallback(() => {
    if (editor) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkDialogOpen(false);
      setLinkUrl("");
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-input bg-background rounded-t-md p-2">
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const isLinkActive = editor.isActive("link");

  return (
    <TooltipProvider delayDuration={0}>
      <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap items-center gap-1">
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bold")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBold().run()
                }
                aria-label="Bold"
              >
                <Bold className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold (Ctrl+B)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("italic")}
                onPressedChange={() =>
                  editor.chain().focus().toggleItalic().run()
                }
                aria-label="Italic"
              >
                <Italic className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic (Ctrl+I)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("strike")}
                onPressedChange={() =>
                  editor.chain().focus().toggleStrike().run()
                }
                aria-label="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Strikethrough (Ctrl+Shift+X)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("code")}
                onPressedChange={() =>
                  editor.chain().focus().toggleCode().run()
                }
                aria-label="Code"
              >
                <Code className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Code (Ctrl+E)</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                aria-label="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Heading 1</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                aria-label="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Heading 2</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 3 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                aria-label="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Heading 3</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBulletList().run()
                }
                aria-label="Bullet List"
              >
                <List className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bullet List</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("orderedList")}
                onPressedChange={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
                aria-label="Ordered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Numbered List</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5">
          <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Toggle size="sm" pressed={isLinkActive} aria-label="Link">
                    <LinkIcon className="h-4 w-4" />
                  </Toggle>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Link (Ctrl+K)</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {isLinkActive ? "Edit link" : "Add link"}
                </DialogTitle>
                <DialogDescription>
                  Enter the URL for the link.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="link-url" className="text-right">
                    URL
                  </Label>
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="col-span-3"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                {isLinkActive && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRemoveLink}
                    className="mr-auto"
                  >
                    <Unlink className="mr-2 h-4 w-4" /> Remove Link
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsLinkDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSetLink}>
                    Save
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                aria-label="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                aria-label="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export function TicketEditor({
  ticketId,
  placeholder = "Start typing your response...",
}: EditorProps) {
  const [editorContent, setEditorContent] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const router = useRouter();

  const {
    completion: aiReply,
    complete,
    isLoading: isLoadingAiReply,
    error: aiError,
  } = useCompletion({
    api: "/api/ai/generate-reply",
    body: { ticketId: ticketId },
    onFinish: () => setIsAiGenerating(false),
    onError: (err) => {
      toast.error("Failed to generate AI response", {
        description: err.message,
      });
      setIsAiGenerating(false);
    },
  });
  useEffect(() => {
    if (aiReply) {
      setEditorContent(aiReply);
    }
  }, [aiReply]);
  const handleEditorChange = useCallback((content: string) => {
    setEditorContent(content);
  }, []);
  const handleGenerateAiResponse = useCallback(async () => {
    setIsAiGenerating(true);
    await complete("");
  }, [complete]);

  const handleSubmitReply = useCallback(async () => {
    if (!editorContent || editorContent === "<p></p>") return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editorContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit reply");
      }

      setEditorContent("");

      router.refresh();

      toast.success("Reply submitted successfully", {
        description: "Your reply has been sent successfully",
      });
      
    } catch (error) {
      console.error("Submit Reply Error:", error);
      toast.error("An error occurred while submitting the reply", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editorContent, ticketId]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc pl-6" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-6" } },
      }),
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-primary underline",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          "prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-xl",
          "max-w-full focus:outline-none min-h-[150px] p-4",
          "border border-input border-t-0 rounded-b-md"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      handleEditorChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.getHTML() !== editorContent) {
      editor.commands.setContent(editorContent, false);
    }
  }, [editorContent, editor]);

  return (
    <div className="relative">
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="bg-background border border-border shadow-md rounded-md p-1"
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerateAiResponse}
            disabled={isLoadingAiReply}
          >
            {isLoadingAiReply ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />{" "}
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
              </>
            )}
          </Button>
        </BubbleMenu>
      )}

      <Toolbar editor={editor} />
      <EditorContent editor={editor} />

      <div className="flex justify-end gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateAiResponse}
          disabled={isLoadingAiReply}
        >
          {isLoadingAiReply ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Generate AI Response
            </>
          )}
        </Button>
        <Button
          size="sm"
          onClick={handleSubmitReply}
          disabled={
            isLoadingAiReply ||
            isSubmitting ||
            !editor?.getHTML() ||
            editor.getHTML() === "<p></p>"
          }
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Submit Reply
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
