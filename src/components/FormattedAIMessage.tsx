import React from 'react';

interface FormattedAIMessageProps {
  text: string;
  className?: string;
}

const renderInlineFormatting = (line: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = tokenPattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`b-${keyIndex++}`} className="ai-formatted__bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code key={`c-${keyIndex++}`} className="ai-formatted__code">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [line];
};

export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({ text, className = '' }) => {
  const lines = (text || '').split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listItems: { indent: boolean; content: string }[] = [];
  let orderedItems: string[] = [];

  const flushLists = (keyPrefix: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-ul`} className="ai-formatted__list">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className={item.indent ? 'ai-formatted__list-item ai-formatted__list-item--nested' : 'ai-formatted__list-item'}
            >
              {renderInlineFormatting(item.content)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
    if (orderedItems.length > 0) {
      elements.push(
        <ol key={`${keyPrefix}-ol`} className="ai-formatted__list ai-formatted__list--ordered">
          {orderedItems.map((item, idx) => (
            <li key={idx} className="ai-formatted__list-item">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>
      );
      orderedItems = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushLists(`line-${index}`);
      return;
    }

    if (/^---+$/.test(trimmed)) {
      flushLists(`line-${index}`);
      elements.push(<hr key={`hr-${index}`} className="ai-formatted__divider" />);
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushLists(`line-${index}`);
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const HeadingTag = level <= 2 ? 'h4' : 'h5';
      elements.push(
        <HeadingTag key={`h-${index}`} className={`ai-formatted__heading ai-formatted__heading--h${level}`}>
          {renderInlineFormatting(headingText)}
        </HeadingTag>
      );
      return;
    }

    const bulletMatch = rawLine.match(/^(\s*)[*-•]\s+(.*)$/);
    if (bulletMatch) {
      if (orderedItems.length > 0) {
        flushLists(`line-${index}`);
      }
      const isNested = bulletMatch[1].length >= 2;
      listItems.push({ indent: isNested, content: bulletMatch[2].trim() });
      return;
    }

    const orderedMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (orderedMatch) {
      if (listItems.length > 0) {
        flushLists(`line-${index}`);
      }
      orderedItems.push(orderedMatch[1].trim());
      return;
    }

    flushLists(`line-${index}`);
    elements.push(
      <p key={`p-${index}`} className="ai-formatted__paragraph">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  });

  flushLists('end');

  return <div className={`ai-formatted ${className}`.trim()}>{elements}</div>;
};

export default FormattedAIMessage;
