import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";

export default function rehypeCodeBlockCopy() {
  return (tree: any) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent) return;

      // Look for <pre><code>
      if (
        node.tagName === "pre" &&
        node.children?.[0]?.tagName === "code"
      ) {
        const codeNode = node.children[0];

        // Use hast-util-to-string to extract all text content, including from nested spans
        const codeText = toString(codeNode);

        // Set by the Shiki transformer in lib/markdown/index.ts. Plain-text
        // fences get no label: "text" says nothing the reader can't see.
        const lang = node.properties?.["data-lang"];
        const label =
          typeof lang === "string" && lang !== "text"
            ? [{ type: "element", tagName: "span", properties: { className: ["code-block-lang"] }, children: [{ type: "text", value: lang }] }]
            : [];

        // Wrap in a parent container div with a Mac-style header: traffic
        // lights + language label + copy button
        parent.children[index as number] = {
          type: "element",
          tagName: "div",
          properties: { className: ["code-block"] },
          children: [
            {
              type: "element",
              tagName: "div",
              properties: { className: ["code-block-header"] },
              children: [
                {
                  type: "element",
                  tagName: "div",
                  properties: { className: ["traffic-lights"], "aria-hidden": "true" },
                  children: [
                    { type: "element", tagName: "span", properties: { className: ["light", "light-red"] }, children: [] },
                    { type: "element", tagName: "span", properties: { className: ["light", "light-yellow"] }, children: [] },
                    { type: "element", tagName: "span", properties: { className: ["light", "light-green"] }, children: [] },
                  ],
                },
                ...label,
                {
                  type: "element",
                  tagName: "button",
                  properties: {
                    type: "button",
                    className: ["copy-btn"],
                    "data-code": codeText,
                    "data-tooltip": "Copy",
                    "aria-label": "Copy code",
                  },
                  children: [],
                },
              ],
            },
            node, // original <pre><code>
          ],
        };
      }
    });
  };
}
