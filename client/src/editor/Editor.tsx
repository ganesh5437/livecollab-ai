import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  onTextChange?: (text: string) => void;
  onSelectionChange?: (range: { from: number; to: number }) => void;
}

export default function Editor({ ydoc, provider, onTextChange, onSelectionChange }: EditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }),
        Collaboration.configure({ document: ydoc }),
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-invert max-w-none min-h-[60vh] px-6 py-4 focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        onTextChange?.(editor.getText());
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        onSelectionChange?.({ from, to });
      },
    },
    [ydoc, provider]
  );

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 backdrop-blur">
      <EditorContent editor={editor} />
    </div>
  );
}
