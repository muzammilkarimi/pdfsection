/**
 * Tailored guide content for tools that do not have an entry in SEO_TOOL_CONTENT.
 * Keyed by route slug (e.g. "pdf-to-word"), which ToolPageLayout falls back to when
 * the tool id has no match. Claims here must match what each tool actually does.
 */

export const SEO_TOOL_CONTENT_BY_ROUTE = {
  'extract-pages': {
    steps: [
      'Upload the PDF you want to take pages from.',
      'Select the pages you want to keep from the page thumbnails.',
      'Click Extract and download a new PDF containing only those pages.'
    ],
    benefits: [
      'Keep Only What You Need: Pull a few pages out of a long report or contract.',
      'Original Untouched: Your source PDF is not changed, you get a new file.',
      'Private: Pages are extracted in your browser and never uploaded.'
    ],
    useCases: [
      'Sending a single signed page instead of a whole agreement.',
      'Pulling one chapter out of a long ebook or manual.',
      'Sharing only the relevant pages of a bank statement or invoice.'
    ],
    faqs: [
      { q: 'How do I extract pages from a PDF?', a: 'Upload your PDF, select the pages you want, and click Extract. You download a new PDF with only those pages.' },
      { q: 'What is the difference between extract and remove pages?', a: 'Extract keeps the pages you pick and drops the rest. Remove pages deletes the pages you pick and keeps the rest.' },
      { q: 'Is my PDF uploaded anywhere?', a: 'No. The extraction runs entirely in your browser, so the file never leaves your device.' }
    ]
  },

  'organize-pdf': {
    steps: [
      'Upload your PDF to see every page as a thumbnail.',
      'Drag pages into a new order, rotate them, or delete the ones you do not need.',
      'Click save and download the reorganized PDF.'
    ],
    benefits: [
      'Visual Control: Rearrange, rotate and delete pages in one place.',
      'No Software: Works in any modern browser on desktop and mobile.',
      'Private: Your document is edited locally and never uploaded.'
    ],
    useCases: [
      'Putting scanned pages back in the right order.',
      'Moving an appendix or cover sheet to the front of a document.',
      'Cleaning up a combined PDF before sending it.'
    ],
    faqs: [
      { q: 'How do I reorder pages in a PDF?', a: 'Upload the PDF, drag the page thumbnails into the order you want, then save the new file.' },
      { q: 'Can I delete and rotate pages at the same time?', a: 'Yes. You can reorder, rotate and remove pages in a single session before downloading.' },
      { q: 'Does reorganizing reduce quality?', a: 'No. Pages are rearranged as they are, so text and images are not recompressed.' }
    ]
  },

  'scan-to-pdf': {
    steps: [
      'Allow camera access, or choose photos of your document.',
      'Capture each page and check that the text is readable.',
      'Click create and download all the pages as one PDF.'
    ],
    benefits: [
      'Phone-Friendly: Turn photos of paper documents into a PDF without an app.',
      'Multi-Page: Combine several photos into a single PDF.',
      'Private: Images are processed in your browser and not uploaded.'
    ],
    useCases: [
      'Scanning receipts and invoices for expense reports.',
      'Digitizing signed forms and ID copies.',
      'Saving handwritten notes or whiteboard photos as a PDF.'
    ],
    faqs: [
      { q: 'How do I scan a document to PDF on my phone?', a: 'Open the tool on your phone, allow camera access, photograph each page, then download the combined PDF.' },
      { q: 'Does it work without installing an app?', a: 'Yes. It runs in your mobile or desktop browser.' },
      { q: 'Are my scans uploaded?', a: 'No. The PDF is built on your device, so your scans stay private.' }
    ]
  },

  'repair-pdf': {
    steps: [
      'Upload the PDF that will not open or shows errors.',
      'The tool rebuilds the file structure and cross-reference table.',
      'Download the repaired PDF and check that it opens.'
    ],
    benefits: [
      'Quick Fix: Attempts to repair damaged file structure in seconds.',
      'Keeps Your Original: You download a new file and your original is untouched.',
      'Private: Repair runs in your browser and nothing is uploaded.'
    ],
    useCases: [
      'Opening a PDF that Acrobat reports as damaged.',
      'Recovering a file from an interrupted download.',
      'Fixing a PDF that opens blank or is missing pages.'
    ],
    faqs: [
      { q: 'How do I fix a corrupted PDF?', a: 'Upload it to the repair tool. It rebuilds the document structure and gives you a new PDF to download.' },
      { q: 'Can every damaged PDF be repaired?', a: 'No. Repair works when the structure is damaged but the content is intact. Severely truncated or overwritten files may not be recoverable.' },
      { q: 'Is it safe to upload a confidential PDF?', a: 'The file is repaired in your browser and is not sent to a server.' }
    ]
  },

  'jpg-to-pdf': {
    steps: [
      'Upload one or more JPG or PNG images.',
      'Drag the images into the order you want them to appear.',
      'Click convert and download your PDF.'
    ],
    benefits: [
      'Many Images, One PDF: Combine photos or scans into a single document.',
      'Custom Order: Arrange the pages before you convert.',
      'Private: Images are converted in your browser and never uploaded.'
    ],
    useCases: [
      'Turning phone photos of documents into one PDF.',
      'Combining screenshots into a single report.',
      'Making a portfolio or photo album PDF.'
    ],
    faqs: [
      { q: 'How do I convert a JPG to PDF?', a: 'Upload your image, click convert, and download the PDF. You can add several images to make a multi-page PDF.' },
      { q: 'Can I convert multiple JPGs into one PDF?', a: 'Yes. Add all your images, put them in order, and they are combined into one PDF.' },
      { q: 'Will image quality drop?', a: 'Images are placed into the PDF without extra compression of your photos.' }
    ]
  },

  'word-to-pdf': {
    steps: [
      'Upload your Word document (.docx).',
      'The tool reads the document text and basic formatting.',
      'Download the finished PDF.'
    ],
    benefits: [
      'No Word Required: Convert .docx files on any device with a browser.',
      'Private: The document is processed locally, not on a server.',
      'Free: No sign-up and no watermark.'
    ],
    useCases: [
      'Turning a CV or cover letter into a PDF for job applications.',
      'Sending a report in a format that looks the same for everyone.',
      'Archiving documents as PDFs.'
    ],
    faqs: [
      { q: 'How do I convert Word to PDF for free?', a: 'Upload your .docx file and click convert. The PDF downloads straight to your device.' },
      { q: 'Will my formatting be preserved?', a: 'Text, headings, lists and basic formatting are kept. Complex layouts, text boxes and some embedded objects may look different, so check the PDF before sending it.' },
      { q: 'Is my document uploaded?', a: 'No. Conversion happens in your browser.' }
    ]
  },

  'powerpoint-to-pdf': {
    steps: [
      'Upload your PowerPoint file (.pptx).',
      'The tool reads the text on each slide.',
      'Download the PDF.'
    ],
    benefits: [
      'No PowerPoint Required: Convert slides on any device.',
      'Private: The file is processed in your browser.',
      'Free: No sign-up and no watermark.'
    ],
    useCases: [
      'Sharing slide text as a handout.',
      'Archiving presentations as PDFs.',
      'Reading slide content on devices without PowerPoint.'
    ],
    faqs: [
      { q: 'How do I convert PowerPoint to PDF?', a: 'Upload your .pptx file and click convert, then download the PDF.' },
      { q: 'Will my slide design and images be kept?', a: 'This converter extracts the text content of your slides. Backgrounds, images and animations are not reproduced, so use it for text handouts rather than design-accurate copies.' },
      { q: 'Is my presentation uploaded?', a: 'No. It is converted in your browser.' }
    ]
  },

  // Claims checked against lib/xlsxToPdf.js and lib/domToPdf.js (2026-11-08).
  'excel-to-pdf': {
    steps: [
      'Open your Excel file (.xlsx). An old .xls file needs to be saved as .xlsx first.',
      'Check the preview. Each visible sheet becomes one or more PDF pages.',
      'Click Convert to PDF and download the file.'
    ],
    benefits: [
      'Keeps the Look: Cell colors, borders, merged cells, bold and italic text, number and date formats, and charts are carried over.',
      'Print-Ready Pages: Uses the sheet\'s print area, paper size, margins and orientation, and switches wide sheets to landscape.',
      'Private and Free: Converted in your browser, with no upload, no sign-up and no watermark.'
    ],
    useCases: [
      'Sending an invoice, price list or report that nobody can edit by accident.',
      'Submitting a marks sheet, timesheet or fee statement where a portal asks for a PDF.',
      'Printing a spreadsheet from a phone or a computer without Excel.'
    ],
    faqs: [
      { q: 'How do I convert Excel to PDF?', a: 'Open your .xlsx file on this page, check the preview and click Convert to PDF. The PDF downloads straight away, and the spreadsheet never leaves your device.' },
      { q: 'How do I fit an Excel sheet on one page in the PDF?', a: 'In Excel, go to Page Layout and set Width to 1 page, then save and convert the file here. The converter follows that setting. Without it, wide sheets switch to landscape and shrink to no less than 70%, and any columns that still do not fit continue on the next page. To export only part of a sheet, set a print area.' },
      { q: 'Are charts, formatting and formulas kept?', a: 'Charts, cell colors, borders, merged cells, and number and date formats are kept. Formulas show the last result saved in the file. Pictures are not included yet, rotated text is drawn horizontally, and fonts are replaced with standard PDF fonts, so text can look slightly different.' },
      { q: 'Can I convert .xls or .csv files?', a: 'Not yet. Save the file as .xlsx in Excel, Google Sheets or LibreOffice, then convert it here.' },
      { q: 'Which sheets are converted?', a: 'All visible sheets. Hidden sheets, rows and columns are skipped. Very large sheets stop after 3,000 rows or 120 columns, and the tool tells you when that happens.' },
      { q: 'Is my spreadsheet uploaded?', a: 'No. The conversion runs in your browser, so your data stays on your device.' }
    ]
  },

  'html-to-pdf': {
    steps: [
      'Paste your HTML or text into the editor.',
      'Preview the content.',
      'Click convert and download the PDF.'
    ],
    benefits: [
      'Quick Export: Turn pasted content into a PDF in seconds.',
      'Private: Your content stays in your browser.',
      'Free: No sign-up.'
    ],
    useCases: [
      'Saving pasted notes or text as a PDF.',
      'Creating a simple printable document.',
      'Exporting copied web content for offline reading.'
    ],
    faqs: [
      { q: 'How do I convert HTML to PDF?', a: 'Paste your content into the tool and click convert. The PDF downloads to your device.' },
      { q: 'Does it keep CSS styling?', a: 'This tool produces a simple text-based PDF and does not render full CSS layouts.' },
      { q: 'Is my content sent to a server?', a: 'No. The PDF is generated in your browser.' }
    ]
  },

  'pdf-to-jpg': {
    steps: [
      'Upload your PDF.',
      'Choose which pages to convert and the image quality.',
      'Download your JPG images.'
    ],
    benefits: [
      'Every Page as an Image: Convert one page or the whole document.',
      'Adjustable Quality: Balance image sharpness and file size.',
      'Private: Pages are rendered in your browser and not uploaded.'
    ],
    useCases: [
      'Sharing a PDF page as an image on social media or chat.',
      'Inserting a page into a slide or web page.',
      'Making thumbnails of document pages.'
    ],
    faqs: [
      { q: 'How do I convert a PDF to JPG?', a: 'Upload your PDF, pick the pages and quality, then download the JPG images.' },
      { q: 'Can I convert all pages at once?', a: 'Yes. Every page is turned into its own image.' },
      { q: 'Is my PDF uploaded?', a: 'No. Conversion happens in your browser.' }
    ]
  },

  'pdf-to-word': {
    steps: [
      'Upload your PDF.',
      'The tool extracts the text from every page.',
      'Download an editable Word (.docx) file.'
    ],
    benefits: [
      'Editable Text: Get the document text into Word to edit and reuse.',
      'No Software: Works in any modern browser.',
      'Private: Extraction runs locally and nothing is uploaded.'
    ],
    useCases: [
      'Reusing text from a PDF report or contract.',
      'Editing a document when you no longer have the original Word file.',
      'Copying long passages without retyping them.'
    ],
    faqs: [
      { q: 'How do I convert a PDF to Word?', a: 'Upload your PDF and click convert. You download a .docx file with the document text.' },
      { q: 'Will the layout, images and tables be kept?', a: 'No. This converter extracts the text only, so images and exact layout are not carried over. You may need to reformat the result.' },
      { q: 'Does it work on scanned PDFs?', a: 'Only if the PDF contains real text. For scanned pages, run the OCR PDF tool first to make the text selectable.' }
    ]
  },

  'pdf-to-powerpoint': {
    steps: [
      'Upload your PDF.',
      'The tool extracts the text from each page.',
      'Download a PowerPoint (.pptx) file with one slide per page.'
    ],
    benefits: [
      'Quick Starting Point: Turn document text into slides.',
      'No Software: Runs in your browser.',
      'Private: Nothing is uploaded.'
    ],
    useCases: [
      'Building a presentation from a report outline.',
      'Reusing the text of a document in slides.',
      'Creating a first draft of a deck to edit.'
    ],
    faqs: [
      { q: 'How do I convert a PDF to PowerPoint?', a: 'Upload your PDF and click convert. You get a .pptx file with one slide per page.' },
      { q: 'Are images and design kept?', a: 'No. Only the text is extracted, so you will need to add images and styling in PowerPoint.' },
      { q: 'Is my PDF uploaded?', a: 'No. Conversion happens in your browser.' }
    ]
  },

  'pdf-to-excel': {
    steps: [
      'Upload your PDF.',
      'The tool extracts the text from every page.',
      'Download a spreadsheet file you can open in Excel.'
    ],
    benefits: [
      'Get Data Out: Move text from a PDF into a spreadsheet.',
      'Opens in Excel: The result is a CSV file that Excel and Google Sheets read.',
      'Private: Nothing is uploaded.'
    ],
    useCases: [
      'Pulling figures out of a PDF report.',
      'Starting a spreadsheet from a printed list.',
      'Collecting text from several pages in one place.'
    ],
    faqs: [
      { q: 'How do I convert a PDF to Excel?', a: 'Upload your PDF and click convert. You download a CSV file that opens in Excel.' },
      { q: 'Does it detect tables and columns?', a: 'No. It extracts text page by page and does not rebuild table structure, so you may need to split columns yourself.' },
      { q: 'Does it work on scanned PDFs?', a: 'Only if the PDF has real text. Use the OCR PDF tool first for scans.' }
    ]
  },

  'rotate-pdf': {
    steps: [
      'Upload your PDF.',
      'Rotate individual pages, or all pages at once, by 90 or 180 degrees.',
      'Download the corrected PDF.'
    ],
    benefits: [
      'Fix Sideways Pages: Correct scans that came out rotated.',
      'Per-Page Control: Rotate one page or the whole document.',
      'Private: Done in your browser, nothing is uploaded.'
    ],
    useCases: [
      'Fixing upside-down or sideways scans.',
      'Rotating landscape pages in a portrait document.',
      'Making a PDF read correctly before sharing.'
    ],
    faqs: [
      { q: 'How do I rotate a PDF page permanently?', a: 'Rotate the pages in the tool and download the new file. The rotation is saved in the PDF.' },
      { q: 'Can I rotate only one page?', a: 'Yes. You can rotate single pages or all of them.' },
      { q: 'Is quality affected?', a: 'No. Pages are rotated without recompressing their content.' }
    ]
  },

  'add-page-numbers': {
    steps: [
      'Upload your PDF.',
      'Choose the position, starting number and style of the page numbers.',
      'Download the numbered PDF.'
    ],
    benefits: [
      'Professional Look: Add clean page numbers to any document.',
      'Flexible Placement: Choose where on the page the number appears.',
      'Private: Done in your browser, nothing is uploaded.'
    ],
    useCases: [
      'Numbering a thesis, report or manual.',
      'Preparing contracts and legal bundles for reference.',
      'Adding numbers to a merged PDF.'
    ],
    faqs: [
      { q: 'How do I add page numbers to a PDF?', a: 'Upload your PDF, pick the position and starting number, and download the numbered file.' },
      { q: 'Can I start numbering from a number other than 1?', a: 'Yes. You can set the starting number.' },
      { q: 'Is my PDF uploaded?', a: 'No. Page numbers are added in your browser.' }
    ]
  },

  'add-watermark': {
    steps: [
      'Upload your PDF.',
      'Enter your watermark text and adjust its size and opacity.',
      'Download the watermarked PDF.'
    ],
    benefits: [
      'Mark Your Documents: Add text such as CONFIDENTIAL or DRAFT.',
      'Adjustable: Control the opacity and size so it does not hide the content.',
      'Private: Done in your browser, nothing is uploaded.'
    ],
    useCases: [
      'Marking a document as a draft or confidential.',
      'Adding your name or company to shared files.',
      'Discouraging reuse of a document.'
    ],
    faqs: [
      { q: 'How do I add a watermark to a PDF?', a: 'Upload your PDF, type your watermark text, adjust how it looks, and download the result.' },
      { q: 'Can I control how visible the watermark is?', a: 'Yes. You can change the opacity so it does not hide the content.' },
      { q: 'Is my PDF uploaded?', a: 'No. The watermark is applied in your browser.' }
    ]
  },

  'crop-pdf': {
    steps: [
      'Upload your PDF.',
      'Drag the crop box over the area you want to keep.',
      'Download the cropped PDF.'
    ],
    benefits: [
      'Trim Margins: Remove white space or unwanted edges.',
      'Visual Editing: See the crop area on the page before you save.',
      'Private: Done in your browser, nothing is uploaded.'
    ],
    useCases: [
      'Removing scanner borders and margins.',
      'Focusing a page on a single table or figure.',
      'Making pages fit better on a small screen.'
    ],
    faqs: [
      { q: 'How do I crop a PDF?', a: 'Upload your PDF, drag the crop area to the part you want to keep, and download the new file.' },
      { q: 'Can I crop every page the same way?', a: 'Yes, you can apply the crop area to all pages.' },
      { q: 'Is my PDF uploaded?', a: 'No. Cropping happens in your browser.' }
    ]
  },

  'compare-pdf': {
    steps: [
      'Upload the two PDF versions you want to compare.',
      'The tool shows them side by side and highlights differences.',
      'Review the changes and decide which version to keep.'
    ],
    benefits: [
      'Spot Changes Fast: See what differs between two versions.',
      'Side by Side: Review both documents together.',
      'Private: Both files are compared in your browser and not uploaded.'
    ],
    useCases: [
      'Checking what changed between contract drafts.',
      'Reviewing edits to a report.',
      'Confirming a revised document matches the approved one.'
    ],
    faqs: [
      { q: 'How do I compare two PDFs?', a: 'Upload both files. They are shown side by side with differences highlighted.' },
      { q: 'Is it safe for confidential documents?', a: 'Yes. Both files are processed in your browser and are not uploaded.' },
      { q: 'Can I compare scanned PDFs?', a: 'Text comparison works best on PDFs with real text. For scans, run OCR first.' }
    ]
  },

  'ai-summarizer': {
    steps: [
      'Upload your PDF.',
      'Choose how many sentences you want in the summary.',
      'Read or download the summary.'
    ],
    benefits: [
      'Fast Overview: Get the key sentences from a long document.',
      'Adjustable Length: Pick a shorter or longer summary.',
      'Private: The summary is built in your browser and the text is not uploaded.'
    ],
    useCases: [
      'Skimming a long report before reading it in full.',
      'Pulling key points from meeting notes or articles.',
      'Deciding whether a document is worth a full read.'
    ],
    faqs: [
      { q: 'How does the PDF summarizer work?', a: 'It scores the sentences in your document by how important their words are and returns the top ones. It selects existing sentences; it does not write new text.' },
      { q: 'Is my document sent to an AI service?', a: 'No. The summary is calculated in your browser, and your text is not sent to any server.' },
      { q: 'Does it work on scanned PDFs?', a: 'Only if the PDF has real text. For scans, run the OCR PDF tool first.' }
    ]
  },

  'translate-pdf': {
    subtitle: 'Everything you need to know about translating your PDF text. Unlike most PDF Section tools, translation uses an external service.',
    steps: [
      'Upload your PDF.',
      'Choose the language to translate into.',
      'Download or copy the translated text.'
    ],
    benefits: [
      'Many Languages: Translate document text into the language you need.',
      'Quick Results: Get a rough translation without installing software.',
      'Clear Privacy Note: Text is sent to a third-party translation service to be translated.'
    ],
    useCases: [
      'Understanding a document written in another language.',
      'Getting the gist of a foreign-language report.',
      'Drafting a rough translation to refine later.'
    ],
    faqs: [
      { q: 'How do I translate a PDF?', a: 'Upload your PDF, pick the target language, and the tool translates the text for you to copy or download.' },
      { q: 'Is my document private?', a: 'Unlike most tools on PDF Section, translation needs an external service. The text is sent to a third-party translation API (MyMemory), so do not translate confidential documents here.' },
      { q: 'How accurate is the translation?', a: 'It is machine translation and works best for getting the general meaning. Do not rely on it for legal or medical documents.' }
    ]
  },

  'pdf-to-markdown': {
    steps: [
      'Upload your PDF.',
      'Choose whether to include a title header and keep the original line layout.',
      'Download the Markdown (.md) file.'
    ],
    benefits: [
      'Plain-Text Friendly: Get PDF text as Markdown for notes, docs and wikis.',
      'Options: Include a header or keep the raw line layout.',
      'Private: Extraction runs in your browser and nothing is uploaded.'
    ],
    useCases: [
      'Moving PDF text into Notion, Obsidian or a docs site.',
      'Preparing text for editing in a code editor.',
      'Feeding document text into other tools.'
    ],
    faqs: [
      { q: 'How do I convert a PDF to Markdown?', a: 'Upload your PDF, choose your options, and download the .md file.' },
      { q: 'Are headings, tables and images converted?', a: 'The tool extracts the text. Images are not included and complex tables are not rebuilt, so expect to tidy the output.' },
      { q: 'Does it work on scanned PDFs?', a: 'Only if the PDF has real text. Use the OCR PDF tool first for scans.' }
    ]
  }
};
