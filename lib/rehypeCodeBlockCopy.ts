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

        // Wrap in a parent container div with Mac-style header
        parent.children[index as number] = {
          type: "element",
          tagName: "div",
          properties: { className: ["code-block"] },
          children: [
            // Mac-style header bar with traffic lights
            {
              type: "element",
              tagName: "div",
              properties: { className: ["code-block-header"] },
              children: [
                {
                  type: "element",
                  tagName: "div",
                  properties: { className: ["traffic-lights"] },
                  children: [
                    { type: "element", tagName: "span", properties: { className: ["light", "light-red"] }, children: [] },
                    { type: "element", tagName: "span", properties: { className: ["light", "light-yellow"] }, children: [] },
                    { type: "element", tagName: "span", properties: { className: ["light", "light-green"] }, children: [] },
                  ],
                },
                {
                  type: "element",
                  tagName: "button",
                  properties: {
                    className: ["copy-btn"],
                    "data-code": codeText,
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
