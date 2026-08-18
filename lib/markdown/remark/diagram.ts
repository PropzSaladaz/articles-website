import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

const diagramTypes = new Set(['flow', 'branch', 'compare']);
const blockTones = new Set(['start', 'end', 'source', 'positive', 'neutral', 'warning', 'muted']);

function attribute(node: any, name: string): string {
  const value = node.attributes?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

function diagramProperties(type: string, label: string) {
  return {
    className: ['content-diagram', `content-diagram--${type}`],
    role: 'img',
    'aria-label': label || 'Diagram',
  };
}

function createBlock(children: any[], tone = '') {
  return {
    type: 'containerDirective',
    name: 'block',
    children,
    data: {
      hName: 'div',
      hProperties: {
        className: ['content-diagram__block', ...(tone ? [`content-diagram__block--${tone}`] : [])],
      },
    },
  };
}

function listItems(node: any): any[] {
  const list = node.children?.find((child: any) => child.type === 'list');
  return list?.children ?? [];
}

function directiveLabel(node: any, fallback: string): string {
  if (typeof node.label === 'string' && node.label.trim()) {
    return node.label.trim();
  }

  const labelNode = node.children?.find(
    (child: any) => child.type === 'paragraph' && child.data?.directiveLabel
  );
  const label = labelNode ? toString(labelNode).trim() : '';
  return label || fallback;
}

function firstContentParagraph(node: any) {
  return node.children?.find(
    (child: any) => child.type === 'paragraph' && !child.data?.directiveLabel
  );
}

function splitOutcomeTitle(item: any) {
  const firstParagraph = item.children?.[0];
  const firstChild = firstParagraph?.children?.[0];

  if (firstParagraph?.type !== 'paragraph' || firstChild?.type !== 'strong' || firstParagraph.children.length < 2) {
    return item.children ?? [];
  }

  const bodyChildren = firstParagraph.children.slice(1);
  const leadingText = bodyChildren[0];
  if (leadingText?.type === 'text') {
    leadingText.value = leadingText.value.replace(/^:\s*/, '');
  }

  return [
    { type: 'paragraph', children: [firstChild] },
    { type: 'paragraph', children: bodyChildren },
    ...(item.children.slice(1) ?? []),
  ];
}

/**
 * Render composable content-diagram directives.
 *
 * Author-friendly forms:
 * :::flow[Process]
 * - First step
 * - Next step
 * :::
 *
 * :::outcomes[Decision]
 * Source value
 *
 * - **Positive case**: Result
 * - **Negative case**: Other result
 * :::
 *
 * :::compare[Two related concepts]
 * - **First concept**: Its distinguishing meaning
 * - **Second concept**: Its distinguishing meaning
 * :::
 *
 * Advanced form:
 * Example:
 * :::diagram[Finite-field construction]{type="flow"}
 * :::block{tone="start"}
 * Continuous real curve
 * :::
 * :::block
 * Finite coordinate set
 * :::
 * :::
 *
 * For a branching diagram, place a source block first, then group outcome
 * blocks in a `:::branch` container.
 */
const remarkDiagram: Plugin<[], Root> = () => {
  return (tree: any) => {
    visit(tree, (node: any) => node.type === 'containerDirective', (node: any) => {
      if (node.name === 'diagram') {
        const requestedType = attribute(node, 'type');
        const type = diagramTypes.has(requestedType) ? requestedType : 'flow';
        const label = directiveLabel(node, 'Diagram');

        node.data ||= {};
        node.data.hName = 'figure';
        node.data.hProperties = diagramProperties(type, label);
      }

      if (node.name === 'flow') {
        const label = directiveLabel(node, 'Flow diagram');
        const items = listItems(node);

        node.data ||= {};
        node.data.hName = 'figure';
        node.data.hProperties = diagramProperties('flow', label);
        node.children = items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          return createBlock(item.children ?? [], isFirst ? 'start' : isLast ? 'end' : '');
        });
      }

      if (node.name === 'outcomes') {
        const label = directiveLabel(node, 'Outcome diagram');
        const items = listItems(node);
        const source = firstContentParagraph(node);
        const tones = ['positive', 'neutral', 'warning'];

        node.data ||= {};
        node.data.hName = 'figure';
        node.data.hProperties = diagramProperties('branch', label);
        node.children = [
          createBlock(source ? [source] : [], 'source'),
          {
            type: 'containerDirective',
            name: 'branch',
            children: items.map((item, index) => createBlock(splitOutcomeTitle(item), tones[index] ?? 'muted')),
            data: {
              hName: 'div',
              hProperties: { className: ['content-diagram__branch'] },
            },
          },
        ];
      }

      if (node.name === 'compare') {
        const label = directiveLabel(node, 'Comparison');
        const items = listItems(node);

        node.data ||= {};
        node.data.hName = 'figure';
        node.data.hProperties = {
          ...diagramProperties('compare', label),
          role: 'group',
        };
        node.children = items.map((item) => createBlock(splitOutcomeTitle(item)));
      }

      if (node.name === 'block') {
        const requestedTone = attribute(node, 'tone');
        const tone = blockTones.has(requestedTone) ? requestedTone : '';

        node.data ||= {};
        node.data.hName = 'div';
        node.data.hProperties = {
          className: ['content-diagram__block', ...(tone ? [`content-diagram__block--${tone}`] : [])],
        };
      }

      if (node.name === 'branch') {
        node.data ||= {};
        node.data.hName = 'div';
        node.data.hProperties = {
          className: ['content-diagram__branch'],
        };
      }
    });
  };
};

export default remarkDiagram;
