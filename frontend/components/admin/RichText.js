'use client';
import { useEffect, useRef } from 'react';
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered } from 'lucide-react';

// A small WYSIWYG editor. Output is HTML; the API sanitises it again before storing.
export default function RichText({ value, onChange, label }) {
  const ref = useRef(null);
  const last = useRef(null);

  // Only push external changes into the DOM (loading a record); never while typing, which would move the caret.
  useEffect(() => {
    if (ref.current && value !== last.current) {
      ref.current.innerHTML = value || '';
      last.current = value;
    }
  }, [value]);

  const emit = () => {
    last.current = ref.current.innerHTML;
    onChange(last.current);
  };
  const run = (cmd, arg) => {
    ref.current.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };
  const link = () => {
    const url = window.prompt('Link address (https://...)');
    if (url && /^(https?:\/\/|\/|mailto:)/.test(url)) run('createLink', url);
  };
  const tools = [
    [Bold, 'Bold', () => run('bold')],
    [Italic, 'Italic', () => run('italic')],
    [Heading2, 'Heading', () => run('formatBlock', 'h2')],
    [Heading3, 'Subheading', () => run('formatBlock', 'h3')],
    [List, 'Bullet list', () => run('insertUnorderedList')],
    [ListOrdered, 'Numbered list', () => run('insertOrderedList')],
    [Link2, 'Link', link],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border border-b-0 border-line bg-bone p-1" role="toolbar" aria-label="Formatting">
        {tools.map(([Icon, name, fn]) => (
          <button key={name} type="button" title={name} aria-label={name} onMouseDown={(e) => e.preventDefault()} onClick={fn} className="flex size-8 cursor-pointer items-center justify-center hover:bg-white">
            <Icon className="size-4" />
          </button>
        ))}
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'p')} className="h-8 cursor-pointer px-2 text-xs font-semibold hover:bg-white">
          Normal text
        </button>
      </div>
      <div
        ref={ref}
        className="rich max-h-[480px] overflow-y-auto"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          // Paste as plain text so Word / web formatting does not leak in.
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
      />
    </div>
  );
}
