import sanitizeHtml from "sanitize-html";

const MAX_DESCRIPTION_LENGTH = 20_000;

const allowedTags = [
  "a",
  "blockquote",
  "br",
  "code",
  "em",
  "h2",
  "h3",
  "h4",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "u",
  "ul",
];

const allowedAttributes: Record<string, sanitizeHtml.AllowedAttribute[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainTextToHtml(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.split("\n").map((line) => escapeHtml(line)).join("<br />")}</p>`)
    .join("");
}

export function sanitizeProductDescription(value: string | null | undefined): string | null {
  if (!value) return null;

  const source = /<\s*[a-z][^>]*>/i.test(value) ? value : plainTextToHtml(value);
  const sanitized = sanitizeHtml(source.slice(0, MAX_DESCRIPTION_LENGTH), {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: {
      a: ["http", "https"],
      img: ["http", "https"],
    },
    allowedClasses: {},
    parseStyleAttributes: false,
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          href: attribs.href ?? "",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    },
  }).trim();

  const text = sanitized.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text || /<img\b[^>]*>/i.test(sanitized) ? sanitized || null : null;
}

export function descriptionToText(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const sanitized = sanitizeProductDescription(value);
  if (!sanitized) return undefined;
  return sanitized
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export { MAX_DESCRIPTION_LENGTH };
