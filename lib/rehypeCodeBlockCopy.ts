import { visit } from "unist-util-visit"

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
        const codeText = codeNode.children
          .filter((n: any) => n.type === "text")
          .map((n: any) => n.value)
          .join("");

        // Wrap in a parent container div
        parent.children[index as number] = {
          type: "element",
          tagName: "div",
          properties: { className: ["code-block"] },
          children: [
            {
              type: "element",
              tagName: "button",
              properties: {
                className: ["copy-btn"],
                "data-code": codeText,
              },
              children: [{ type: "text", value: "Copy" }],
            },
            node, // original <pre><code>
          ],
        };
      }
    });
  };
}
