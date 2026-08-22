import { useEffect, useState } from "react";

type TextTypeProps = {
  text: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  className?: string;
};

/**
 * Typewriter effect that cycles through a list of strings.
 */
export default function TextType({
  text,
  typingSpeed = 75,
  deletingSpeed = 40,
  pauseDuration = 1500,
  showCursor = true,
  cursorCharacter = "|",
  className,
}: TextTypeProps) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = text[index % text.length] ?? "";

    if (!deleting && display === full) {
      const t = setTimeout(() => setDeleting(true), pauseDuration);
      return () => clearTimeout(t);
    }

    if (deleting && display === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % text.length);
      return;
    }

    const t = setTimeout(
      () => {
        setDisplay((d) => (deleting ? full.slice(0, d.length - 1) : full.slice(0, d.length + 1)));
      },
      deleting ? deletingSpeed : typingSpeed,
    );
    return () => clearTimeout(t);
  }, [display, deleting, index, text, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      <span>{display}</span>
      {showCursor ? (
        <span className="animate-pulse text-primary" aria-hidden="true">
          {cursorCharacter}
        </span>
      ) : null}
    </span>
  );
}
