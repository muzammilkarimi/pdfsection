// Tool registry — all PDF tools with metadata
// Icons use Lucide icon names (rendered as SVG in components)

export const TOOL_CATEGORIES = [
  {
    id: 'organize',
    label: 'Organize PDF',
    color: 'var(--tool-organize)',
    tools: [
      {
        id: 'merge',
        name: 'Merge PDF',
        description: 'Combine multiple PDFs into a single document',
        icon: 'merge',
        route: '/merge-pdf',
      },
      {
        id: 'split',
        name: 'Split PDF',
        description: 'Separate PDF pages into individual files',
        icon: 'split',
        route: '/split-pdf',
      },
      {
        id: 'remove-pages',
        name: 'Remove Pages',
        description: 'Delete unwanted pages from your PDF',
        icon: 'trash',
        route: '/remove-pages',
      },
      {
        id: 'extract-pages',
        name: 'Extract Pages',
        description: 'Extract specific pages from a PDF',
        icon: 'extract',
        route: '/extract-pages',
      },
      {
        id: 'organize',
        name: 'Organize PDF',
        description: 'Sort and rearrange PDF pages with drag & drop',
        icon: 'reorder',
        route: '/organize-pdf',
      },
    ],
  },
  {
    id: 'optimize',
    label: 'Optimize PDF',
    color: 'var(--tool-optimize)',
    tools: [
      {
        id: 'compress',
        name: 'Compress PDF',
        description: 'Reduce file size while keeping quality',
        icon: 'compress',
        route: '/compress-pdf',
      },
    ],
  },
  {
    id: 'convert-to',
    label: 'Convert to PDF',
    color: 'var(--tool-convert-to)',
    tools: [
      {
        id: 'jpg-to-pdf',
        name: 'JPG to PDF',
        description: 'Convert images to PDF documents',
        icon: 'image',
        route: '/jpg-to-pdf',
      },
      {
        id: 'word-to-pdf',
        name: 'WORD to PDF',
        description: 'Convert Word documents to PDF format',
        icon: 'word',
        route: '/word-to-pdf',
      },
      {
        id: 'powerpoint-to-pdf',
        name: 'POWERPOINT to PDF',
        description: 'Convert PowerPoint presentations to PDF',
        icon: 'powerpoint',
        route: '/powerpoint-to-pdf',
      },
      {
        id: 'excel-to-pdf',
        name: 'EXCEL to PDF',
        description: 'Convert Excel spreadsheets to PDF',
        icon: 'excel',
        route: '/excel-to-pdf',
      },
      {
        id: 'html-to-pdf',
        name: 'HTML to PDF',
        description: 'Convert web pages into PDF documents',
        icon: 'html',
        route: '/html-to-pdf',
      },
    ],
  },
  {
    id: 'convert-from',
    label: 'Convert from PDF',
    color: 'var(--tool-convert-from)',
    tools: [
      {
        id: 'pdf-to-jpg',
        name: 'PDF to JPG',
        description: 'Convert PDF pages into JPG images',
        icon: 'image',
        route: '/pdf-to-jpg',
      },
      {
        id: 'pdf-to-word',
        name: 'PDF to WORD',
        description: 'Convert PDF files to editable Word documents',
        icon: 'word',
        route: '/pdf-to-word',
      },
      {
        id: 'pdf-to-powerpoint',
        name: 'PDF to POWERPOINT',
        description: 'Convert PDF files to PowerPoint slides',
        icon: 'powerpoint',
        route: '/pdf-to-powerpoint',
      },
      {
        id: 'pdf-to-excel',
        name: 'PDF to EXCEL',
        description: 'Extract data from PDF to Excel spreadsheets',
        icon: 'excel',
        route: '/pdf-to-excel',
      },
    ],
  },
  {
    id: 'edit',
    label: 'Edit PDF',
    color: 'var(--tool-edit)',
    tools: [
      {
        id: 'rotate',
        name: 'Rotate PDF',
        description: 'Rotate PDF pages to the correct orientation',
        icon: 'rotate',
        route: '/rotate-pdf',
      },
      {
        id: 'page-numbers',
        name: 'Add Page Numbers',
        description: 'Insert page numbers into your PDF',
        icon: 'hash',
        route: '/add-page-numbers',
      },
      {
        id: 'watermark',
        name: 'Add Watermark',
        description: 'Stamp text or image watermarks on pages',
        icon: 'watermark',
        route: '/add-watermark',
      },
      {
        id: 'crop',
        name: 'Crop PDF',
        description: 'Adjust visible area and crop margins',
        icon: 'crop',
        route: '/crop-pdf',
      },
      {
        id: 'edit',
        name: 'Edit PDF',
        description: 'Add text, images, shapes and annotations',
        icon: 'edit',
        route: '/edit-pdf',
      },
      {
        id: 'pdf-forms',
        name: 'PDF Forms',
        description: 'Fill out and create interactive PDF forms',
        icon: 'forms',
        route: '/pdf-forms',
      },
    ],
  },
  {
    id: 'security',
    label: 'PDF Security',
    color: 'var(--tool-security)',
    tools: [
      {
        id: 'unlock',
        name: 'Unlock PDF',
        description: 'Remove password protection from PDFs',
        icon: 'unlock',
        route: '/unlock-pdf',
      },
      {
        id: 'protect',
        name: 'Protect PDF',
        description: 'Encrypt your PDF with a password',
        icon: 'lock',
        route: '/protect-pdf',
      },
      {
        id: 'sign',
        name: 'Sign PDF',
        description: 'Draw or upload your signature to PDFs',
        icon: 'sign',
        route: '/sign-pdf',
      },
      {
        id: 'redact',
        name: 'Redact PDF',
        description: 'Permanently black out sensitive information',
        icon: 'redact',
        route: '/redact-pdf',
      },
      {
        id: 'compare',
        name: 'Compare PDF',
        description: 'Highlight differences between two PDFs',
        icon: 'compare',
        route: '/compare-pdf',
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'PDF Intelligence',
    color: 'var(--tool-intelligence)',
    tools: [
      {
        id: 'summarizer',
        name: 'AI Summarizer',
        description: 'Generate concise summaries from PDF content',
        icon: 'brain',
        route: '/ai-summarizer',
      },
      {
        id: 'translate',
        name: 'Translate PDF',
        description: 'Translate PDF documents to other languages',
        icon: 'translate',
        route: '/translate-pdf',
      },
      {
        id: 'pdf-to-markdown',
        name: 'PDF to Markdown',
        description: 'Convert PDFs to Markdown for docs and LLMs',
        icon: 'markdown',
        route: '/pdf-to-markdown',
      },
    ],
  },
];

const PREVIEW_TOOL_IDS = new Set([
  'word-to-pdf',
  'powerpoint-to-pdf',
  'excel-to-pdf',
  'html-to-pdf',
  'pdf-to-word',
  'pdf-to-powerpoint',
  'pdf-to-excel',
  'crop',
  'pdf-forms',
  'redact',
  'compare',
  'summarizer',
  'translate',
]);
// Flatten all tools for search
export const ALL_TOOLS = TOOL_CATEGORIES.flatMap((cat) =>
  cat.tools.map((tool) => ({
    ...tool,
    category: cat.id,
    categoryLabel: cat.label,
    categoryColor: cat.color,
    status: PREVIEW_TOOL_IDS.has(tool.id) ? 'preview' : 'live',
  }))
);


export const LIVE_TOOL_CATEGORIES = TOOL_CATEGORIES.map((cat) => ({
  ...cat,
  tools: cat.tools.filter((tool) => !PREVIEW_TOOL_IDS.has(tool.id)),
})).filter((cat) => cat.tools.length > 0);

export const LIVE_TOOLS = ALL_TOOLS.filter((tool) => tool.status === 'live');
// Get tool by ID
export function getToolById(id) {
  return ALL_TOOLS.find((t) => t.id === id);
}

// Get tool by route
export function getToolByRoute(route) {
  return ALL_TOOLS.find((t) => t.route === route);
}

// Search tools by query
export function searchTools(query) {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_TOOLS;
  return ALL_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.categoryLabel.toLowerCase().includes(q)
  );
}

export function searchLiveTools(query) {
  const q = query.toLowerCase().trim();
  if (!q) return LIVE_TOOLS;
  return LIVE_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.categoryLabel.toLowerCase().includes(q)
  );
}