"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Subscript,
  Superscript,
  Link as LinkIcon,
  Minus,
  Table as TableIcon,
  RotateCcw,
  RotateCw,
  Highlighter,
  Palette,
  Code,
  Maximize2,
  Minimize2,
  ChevronDown,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const SPECIAL_SYMBOLS = ["✅", "❌", "⭐", "•", "➔", "©", "™", "💡", "📍", "📌", "💼", "🚀"];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = "240px",
}: RichTextEditorProps) {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const bgColorInputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = placeholder || t("editor.placeholder");

  const [isFocused, setIsFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      updateCounts();
    }
  }, [value]);

  const updateCounts = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      const trimmed = text.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);
    }
  };

  const handleExecCommand = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateCounts();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html === "<br>" ? "" : html);
      updateCounts();
    }
  };

  const insertLink = () => {
    const url = prompt(t("editor.link"));
    if (url) {
      handleExecCommand("createLink", url);
    }
  };

  const insertSymbol = (sym: string) => {
    handleExecCommand("insertText", sym);
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin:12px 0; border:1px solid #cbd5e1;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #cbd5e1; padding:8px; text-align:left; font-weight:600;">${t("editor.col1")}</th>
            <th style="border:1px solid #cbd5e1; padding:8px; text-align:left; font-weight:600;">${t("editor.col2")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:8px;">${t("editor.item1")}</td>
            <td style="border:1px solid #cbd5e1; padding:8px;">${t("editor.item2")}</td>
          </tr>
        </tbody>
      </table><p></p>
    `;
    handleExecCommand("insertHTML", tableHtml);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-hairline bg-surface shadow-xs overflow-hidden transition-all flex flex-col",
        isFocused && "border-primary shadow-[0_0_0_2px_oklch(0.58_0.16_246/0.18)]",
        isFullscreen && "fixed inset-4 z-50 shadow-2xl rounded-xl border-primary",
        className
      )}
    >
      {/* Sleek Ergonomic Visual Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-hairline bg-surface-muted/60 flex-wrap gap-1 text-ink-secondary select-none">
        <div className="flex items-center gap-0.5 flex-wrap">

          {/* Group 1: Undo / Redo */}
          <button
            type="button"
            onClick={() => handleExecCommand("undo")}
            title={t("editor.undo")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => handleExecCommand("redo")}
            title={t("editor.redo")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          <div className="h-4 w-[1px] bg-hairline mx-1" />

          {/* Group 2: Paragraph / Heading Format Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-surface border border-hairline text-ink font-medium hover:bg-surface-muted transition-colors cursor-pointer">
              <span>{t("editor.textStyle")}</span>
              <ChevronDown className="h-3 w-3 text-ink-faint" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => handleExecCommand("formatBlock", "<p>")}>
                <span>{t("editor.normalText")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExecCommand("formatBlock", "<h1>")} className="font-bold">
                <span>{t("editor.heading1")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExecCommand("formatBlock", "<h2>")} className="font-semibold">
                <span>{t("editor.heading2")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExecCommand("formatBlock", "<h3>")} className="font-medium">
                <span>{t("editor.heading3")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExecCommand("formatBlock", "<blockquote>")}>
                <Quote className="h-3.5 w-3.5 mr-2" />
                <span>{t("editor.quote")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExecCommand("formatBlock", "<pre>")}>
                <Code className="h-3.5 w-3.5 mr-2" />
                <span>{t("editor.codeBlock")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-[1px] bg-hairline mx-1" />

          {/* Group 3: Core Formatting Icon Buttons */}
          <button
            type="button"
            onClick={() => handleExecCommand("bold")}
            title={t("editor.bold")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer font-bold"
          >
            <Bold className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleExecCommand("italic")}
            title={t("editor.italic")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <Italic className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleExecCommand("underline")}
            title={t("editor.underline")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <Underline className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleExecCommand("strikeThrough")}
            title={t("editor.strikethrough")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <Strikethrough className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          <div className="h-4 w-[1px] bg-hairline mx-1" />

          {/* Group 4: Colors */}
          <button
            type="button"
            onClick={() => textColorInputRef.current?.click()}
            title={t("editor.textColor")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <Palette className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
          </button>
          <input ref={textColorInputRef} type="color" className="sr-only" onChange={(e) => handleExecCommand("foreColor", e.target.value)} />

          <button
            type="button"
            onClick={() => bgColorInputRef.current?.click()}
            title={t("editor.highlightColor")}
            className="p-1.5 rounded hover:bg-surface transition-colors cursor-pointer"
          >
            <Highlighter className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />
          </button>
          <input ref={bgColorInputRef} type="color" defaultValue="#fef08a" className="sr-only" onChange={(e) => handleExecCommand("hiliteColor", e.target.value)} />

          <div className="h-4 w-[1px] bg-hairline mx-1" />

          {/* Group 5: Lists & Indentation Icons */}
          <button
            type="button"
            onClick={() => handleExecCommand("insertUnorderedList")}
            title={t("editor.bulletList")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <List className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => handleExecCommand("insertOrderedList")}
            title={t("editor.numberedList")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <ListOrdered className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => handleExecCommand("indent")}
            title={t("editor.indent")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <Indent className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          <div className="h-4 w-[1px] bg-hairline mx-1" />

          {/* Group 6: Alignment Icons */}
          <button
            type="button"
            onClick={() => handleExecCommand("justifyLeft")}
            title={t("editor.alignLeft")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <AlignLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => handleExecCommand("justifyCenter")}
            title={t("editor.alignCenter")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <AlignCenter className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => handleExecCommand("justifyRight")}
            title={t("editor.alignRight")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <AlignRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          <div className="h-4 w-[1px] bg-hairline mx-1" />

          {/* Group 7: Quick Inserts */}
          <button
            type="button"
            onClick={insertLink}
            title={t("editor.link")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={insertTable}
            title={t("editor.table")}
            className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer"
          >
            <TableIcon className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          {/* Group 8: More Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer">
              <MoreHorizontal className="h-3.5 w-3.5 text-ink-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => handleExecCommand("insertHorizontalRule")}>
                <Minus className="h-3.5 w-3.5 mr-2" />
                <span>{t("editor.horizontalRule")}</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-500" />
                  <span>{t("editor.symbols")}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48 p-2 grid grid-cols-4 gap-1">
                  {SPECIAL_SYMBOLS.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => insertSymbol(sym)}
                      className="p-1.5 rounded hover:bg-surface-muted text-center text-sm"
                    >
                      {sym}
                    </button>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExecCommand("subscript")}>
                <Subscript className="h-3.5 w-3.5 mr-2" />
                <span>{t("editor.subscript")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExecCommand("superscript")}>
                <Superscript className="h-3.5 w-3.5 mr-2" />
                <span>{t("editor.superscript")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExecCommand("removeFormat")} className="text-destructive">
                <RemoveFormatting className="h-3.5 w-3.5 mr-2" />
                <span>{t("editor.clearFormat")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={t("editor.fullscreen")}
          className="p-1.5 rounded hover:bg-surface hover:text-ink transition-colors cursor-pointer text-primary ml-auto"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{ minHeight: isFullscreen ? "calc(100vh - 120px)" : minHeight }}
        data-placeholder={defaultPlaceholder}
        className="p-4 text-sm text-ink-secondary focus:outline-none leading-relaxed prose prose-sm max-w-none overflow-y-auto flex-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-ink [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-2.5 [&_h3]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:py-1.5 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:bg-surface-muted/50 [&_blockquote]:rounded-r-md [&_pre]:bg-surface-muted [&_pre]:p-3.5 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-3 [&_p]:mb-2 last:[&_p]:mb-0 [&_a]:text-primary [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-ink-faint empty:before:pointer-events-none"
      />

      {/* Clean Status Bar Footer */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-surface-muted/70 border-t border-hairline text-[11px] text-ink-muted select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-secondary">{t("editor.title")}</span>
          <span>•</span>
          <span>{wordCount} {t("editor.words")}</span>
          <span>•</span>
          <span>{charCount} {t("editor.characters")}</span>
        </div>
      </div>
    </div>
  );
}
