/**
 * Remark plugin to transform GitHub-style alerts into styled HTML.
 * 
 * Syntax:
 *   > [!NOTE]
 *   > **Custom Title Here**
 *   > Content here...
 * 
 * Supported types: NOTE, TIP, IMPORTANT, WARNING, CAUTION
 * 
 * The first **bold** line becomes the clickable title.
 * Everything else becomes the collapsible content.
 */
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const;
type AlertType = typeof ALERT_TYPES[number];

const ALERT_REGEX = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i;

export default function remarkGithubAlerts() {
    return (tree: any) => {
        visit(tree, 'blockquote', (node: any) => {
            if (!node.children || node.children.length === 0) return;

            // Check first child for alert syntax [!TYPE]
            const firstChild = node.children[0];
            if (firstChild.type !== 'paragraph' || !firstChild.children) return;

            const firstText = firstChild.children[0];
            if (firstText?.type !== 'text') return;

            const match = firstText.value.match(ALERT_REGEX);
            if (!match) return;

            const alertType = match[1].toUpperCase() as AlertType;

            // Remove the [!TYPE] marker
            const remainingText = firstText.value.replace(ALERT_REGEX, '').trim();
            if (remainingText) {
                firstText.value = remainingText;
            } else {
                firstChild.children.shift();
                if (firstChild.children.length === 0) {
                    node.children.shift();
                }
            }

            // Look for a title: first paragraph with a **bold** element at the start
            let customTitle: string | null = null;

            if (node.children.length > 0) {
                const potentialTitlePara = node.children[0];
                if (potentialTitlePara.type === 'paragraph' && potentialTitlePara.children) {
                    const firstElement = potentialTitlePara.children[0];
                    // Check if first element is a strong (bold) element
                    if (firstElement?.type === 'strong') {
                        customTitle = toString(firstElement);
                        // Remove the strong element from the paragraph
                        potentialTitlePara.children.shift();
                        // If paragraph is now empty, remove it
                        if (potentialTitlePara.children.length === 0) {
                            node.children.shift();
                        } else if (potentialTitlePara.children[0]?.type === 'text') {
                            // Clean up leading whitespace/newline after bold
                            potentialTitlePara.children[0].value = potentialTitlePara.children[0].value.replace(/^\s*/, '');
                            if (!potentialTitlePara.children[0].value) {
                                potentialTitlePara.children.shift();
                            }
                        }
                    }
                }
            }

            // Build the title text
            const baseTitle = alertType.charAt(0) + alertType.slice(1).toLowerCase();
            const summaryText = customTitle ? `${baseTitle}: ${customTitle}` : baseTitle;

            // Transform the blockquote into a collapsible alert
            node.data = node.data || {};
            node.data.hName = 'details';
            node.data.hProperties = {
                className: [`md-alert`, `md-alert-${alertType.toLowerCase()}`],
                'data-alert-type': alertType,
            };

            // Create summary element with combined title
            const summaryNode = {
                type: 'paragraph',
                data: {
                    hName: 'summary',
                    hProperties: { className: ['md-alert-title'] },
                },
                children: [{ type: 'text', value: summaryText }],
            };

            // Insert summary at the beginning
            node.children.unshift(summaryNode);
        });
    };
}
