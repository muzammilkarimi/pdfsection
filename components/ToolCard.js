import Link from 'next/link';
import { ToolIcon } from './Icons';

export default function ToolCard({ tool, categoryColor }) {
  return (
    <Link href={tool.route} className="tool-card" id={`tool-${tool.id}`}>
      <div
        className="tool-card-icon"
        style={{
          backgroundColor: `color-mix(in srgb, ${categoryColor} 15%, var(--surface-2))`,
          color: categoryColor,
        }}
      >
        <ToolIcon name={tool.icon} size={20} />
      </div>
      <div className="tool-card-title-row">
        <div className="tool-card-title">{tool.name}</div>
        {tool.status === 'preview' && <span className="badge badge-warning">Preview</span>}
      </div>
      <div className="tool-card-description">{tool.description}</div>
    </Link>
  );
}
