/**
 * Central Programmatic SEO (pSEO) Content Registry
 * Defines long-tail keywords, mapped tools, custom copy guides, and FAQ schemas.
 */

export const PSEO_PAGES = [
  // --- Compress & Optimize ---
  {
    slug: 'compress-pdf-to-100kb',
    toolId: 'compress',
    title: 'Compress PDF to 100KB — Free Size Reducer Online',
    description: 'Reduce PDF file size to under 100KB online for free. Compress large scanned documents while keeping text readable. 100% private client-side processing.',
    toolTitle: 'Compress PDF to 100KB',
    toolDescription: 'Compress your PDF to under 100KB instantly. Processes entirely inside your browser.',
    steps: [
      'Select the PDF file you want to shrink below 100KB.',
      'Choose the Maximum Compression preset to optimize image resolutions and stream sizes.',
      'Click Compress PDF and download your lightweight document instantly.'
    ],
    faqs: [
      { question: 'How do I compress a PDF to under 100KB for free?', answer: 'Open your PDF in the Compress PDF tool and choose the Maximum Compression preset. Whether it gets under 100KB depends on the file: PDFs with large images usually shrink the most.' },
      { question: 'Is it secure to compress my files here?', answer: 'Compression runs in your browser, so your file is never uploaded to a server.' }
    ]
  },
  {
    slug: 'compress-pdf-to-200kb',
    toolId: 'compress',
    title: 'Compress PDF to 200KB — Online Size Reducer Free',
    description: 'Shrink and compress PDF documents under 200KB online without losing quality. Ideal for job applications and official portals. Private browser processing.',
    toolTitle: 'Compress PDF to 200KB',
    toolDescription: 'Instantly reduce document sizes down to 200KB locally in your browser memory.',
    steps: [
      'Choose the PDF document to optimize.',
      'Select High or Maximum compression options depending on your current file size.',
      'Save the optimized 200KB PDF to your device.'
    ],
    faqs: [
      { question: 'Can I compress a PDF to exactly 200KB?', answer: 'While exact sizes depend on the original contents, our compression algorithms optimize stream sizes to fit within common 200KB upload limits.' }
    ]
  },
  {
    slug: 'compress-pdf-to-300kb',
    toolId: 'compress',
    title: 'Compress PDF to 300KB — Online PDF Shrinker',
    description: 'Reduce PDF sizes to under 300KB free of charge. Safe client-side document optimization for uploads and emails.',
    toolTitle: 'Compress PDF to 300KB',
    toolDescription: 'Optimize and shrink documents to 300KB locally.',
    steps: [
      'Drag and drop your PDF file.',
      'Select the appropriate compression tier.',
      'Click compress and download.'
    ],
    faqs: [
      { question: 'Does compressing a PDF to 300KB ruin text quality?', answer: 'No. Our compression modes preserve text vectors and only rescale embedded images, keeping text perfectly crisp.' }
    ]
  },
  {
    slug: 'compress-pdf-to-500kb',
    toolId: 'compress',
    title: 'Compress PDF to 500KB — Free Online Tool',
    description: 'Optimize large PDF files under 500KB. Perfect for corporate portal submissions. Fast local client-side processing.',
    toolTitle: 'Compress PDF to 500KB',
    toolDescription: 'Safely compress document sizes below 500KB locally.',
    steps: [
      'Select your PDF file.',
      'Choose the Recommended or High compression options.',
      'Download your optimized document.'
    ],
    faqs: [
      { question: 'Why does my PDF need to be under 500KB?', answer: 'Many email providers and online portals have strict 500KB limits for resume and tax document attachments.' }
    ]
  },
  {
    slug: 'compress-pdf-to-1mb',
    toolId: 'compress',
    title: 'Compress PDF to 1MB — Shrink Large PDFs Online',
    description: 'Compress multi-megabyte PDF files to under 1MB online free. Secure local processing keeps your documents private.',
    toolTitle: 'Compress PDF to 1MB',
    toolDescription: 'Reduce large PDF files to 1MB without server uploads.',
    steps: [
      'Upload the large PDF document.',
      'Select the Recommended compression level.',
      'Download your compressed 1MB document.'
    ],
    faqs: [
      { question: 'Can I shrink scanned documents to 1MB?', answer: 'Yes, our raster flattening algorithms compress high-res scanned image streams to easily fit within 1MB.' }
    ]
  },
  {
    slug: 'compress-pdf-to-2mb',
    toolId: 'compress',
    title: 'Compress PDF to 2MB — Free Online File Compressor',
    description: 'Reduce large PDF sizes to under 2MB. Safe local client-side processing for corporate files.',
    toolTitle: 'Compress PDF to 2MB',
    toolDescription: 'Compress large documents to 2MB locally.',
    steps: [
      'Select your target PDF document.',
      'Apply standard or high compression parameters.',
      'Save the optimized 2MB PDF.'
    ],
    faqs: [
      { question: 'Is there a file size limit?', answer: 'PDF Section runs in browser memory, allowing you to compress large files up to 200MB entirely client-side.' }
    ]
  },
  {
    slug: 'compress-pdf-without-losing-quality',
    toolId: 'compress',
    title: 'Compress PDF Without Losing Quality — Free Online',
    description: 'Reduce PDF file size while keeping high text and image quality. Choose lossless compression option to preserve vectors.',
    toolTitle: 'Lossless PDF Compressor',
    toolDescription: 'Compress PDFs while preserving high visual quality.',
    steps: [
      'Select your PDF document.',
      'Choose the Low Compression (Lossless) option.',
      'Download your optimized document.'
    ],
    faqs: [
      { question: 'What is lossless PDF compression?', answer: 'Lossless compression cleans up redundant metadata, duplicates, and indexing streams without lowering image resolution or stripping vectors.' }
    ]
  },
  {
    slug: 'convert-color-pdf-to-black-and-white',
    toolId: 'grayscale-pdf',
    title: 'Convert Color PDF to Black and White Online Free',
    description: 'Easily convert colored PDF documents to high-contrast Grayscale (Black and White) to save printing ink and costs.',
    toolTitle: 'Color to Grayscale PDF',
    toolDescription: 'Convert full-color PDFs to Black & White locally.',
    steps: [
      'Select the color PDF document.',
      'Click Convert to Grayscale (B&W).',
      'Save the optimized Black & White document.'
    ],
    faqs: [
      { question: 'How can I convert a color PDF to black and white online?', answer: 'Open your PDF in the Grayscale PDF tool, click the action button, and our browser engine converts all RGB pixels to luma values.' }
    ]
  },
  {
    slug: 'grayscale-pdf-ink-saver',
    toolId: 'grayscale-pdf',
    title: 'Grayscale PDF Converter — Save Printing Ink Online',
    description: 'Convert PDF files to grayscale to reduce home and office printing ink consumption. 100% free and private.',
    toolTitle: 'Ink-Saver Grayscale PDF',
    toolDescription: 'Convert PDFs to grayscale to save printing ink.',
    steps: [
      'Upload your document.',
      'Start grayscale conversion.',
      'Download the ink-saver PDF.'
    ],
    faqs: [
      { question: 'Does printing in grayscale save ink?', answer: 'Yes. Grayscale prints require only black ink cartridges, preserving expensive color ink cartridges.' }
    ]
  },

  // --- Legal & Stamping ---
  {
    slug: 'add-bates-numbers-to-court-documents',
    toolId: 'bates-numbering-pdf',
    title: 'Add Bates Numbers to Court Documents — Legal Discovery Stamping',
    description: 'Add sequential Bates numbers to litigation files and legal discovery documents online. Stamping runs in your browser, with no file upload.',
    toolTitle: 'Court Document Bates Stamping',
    toolDescription: 'Stamp legal documents sequentially for litigation discovery.',
    steps: [
      'Upload your legal PDF document.',
      'Configure prefix labels (e.g. EXHIBIT-A-) and starting index.',
      'Download the court-compliant Bates-stamped document.'
    ],
    faqs: [
      { question: 'Why do courts require Bates numbering?', answer: 'Bates numbering provides a standardized sequence to identify and reference pages during legal proceedings.' }
    ]
  },
  {
    slug: 'bates-stamping-pdf-free',
    toolId: 'bates-numbering-pdf',
    title: 'Bates Stamping PDF Online Free — Legal Document Numbering',
    description: 'Stamp legal documents with custom prefixes and numbers. Completely free and secure browser-native legal stamping tool.',
    toolTitle: 'Free Bates Stamping PDF',
    toolDescription: 'Stamp legal documents online free with zero file uploads.',
    steps: [
      'Select the PDF for Bates numbering.',
      'Set custom starting index and digit padding length.',
      'Apply Bates numbering and save your document.'
    ],
    faqs: [
      { question: 'Is my litigation data uploaded to a server?', answer: 'No. All legal stamping occurs inside your local browser memory to ensure 100% client privacy.' }
    ]
  },
  {
    slug: 'add-watermark-to-pdf-pages-free',
    toolId: 'watermark',
    title: 'Add Watermark to PDF Pages Free — Stamp Texts & Images',
    description: 'Stamp custom text or image watermarks onto PDF pages online. Configure positions, transparency, and size locally.',
    toolTitle: 'PDF Watermark Stamping',
    toolDescription: 'Stamp custom text or image watermarks onto documents.',
    steps: [
      'Upload your PDF document.',
      'Type watermark text or upload a custom image.',
      'Apply watermark and download.'
    ],
    faqs: [
      { question: 'Can I apply watermarks to all pages at once?', answer: 'Yes, our tool automatically stamps your custom watermark layout across every page in the PDF.' }
    ]
  },
  {
    slug: 'stamp-draft-confidential-on-pdf',
    toolId: 'watermark',
    title: 'Stamp DRAFT or CONFIDENTIAL on PDF Online Free',
    description: 'Mark your business proposals and sensitive documents with DRAFT, CONFIDENTIAL, or COPY stamps online.',
    toolTitle: 'Stamp Confidential / Draft on PDF',
    toolDescription: 'Add draft, confidential, or copy stamps to your document.',
    steps: [
      'Select your document.',
      'Choose the text preset: DRAFT or CONFIDENTIAL.',
      'Stitch watermark and save.'
    ],
    faqs: [
      { question: 'Can the watermark be easily removed?', answer: 'Once applied, the text layer is compiled directly into the PDF render stream, making it highly secure.' }
    ]
  },
  {
    slug: 'add-page-numbers-to-pdf-free',
    toolId: 'page-numbers',
    title: 'Add Page Numbers to PDF Free — Insert Pagination Online',
    description: 'Add page numbering, headers, or footers to PDF documents. Customize numbering format and position locally.',
    toolTitle: 'Add Page Numbers to PDF Free',
    toolDescription: 'Insert sequential page numbers to your document.',
    steps: [
      'Upload the PDF file.',
      'Choose alignment (bottom, top, left, right) and number formatting.',
      'Apply pagination and download.'
    ],
    faqs: [
      { question: 'Can I start page numbering from page 2?', answer: 'Yes, you can skip the cover page and start sequential numbering from any page index.' }
    ]
  },
  {
    slug: 'insert-page-numbers-in-pdf-document',
    toolId: 'page-numbers',
    title: 'Insert Page Numbers in PDF Document — Online Pagination',
    description: 'Add clean, readable page numbers to multi-page PDF documents. Secure client-side processing.',
    toolTitle: 'Insert Page Numbers',
    toolDescription: 'Configure and stamp page numbers on PDF files.',
    steps: [
      'Drag and drop your PDF file.',
      'Select starting number index and layout position.',
      'Save the paginated file.'
    ],
    faqs: [
      { question: 'Is pagination done locally?', answer: 'Yes, pagination occurs in local client memory using pdf-lib.' }
    ]
  },

  // --- Security & Signatures ---
  {
    slug: 'remove-password-from-pdf-without-software',
    toolId: 'unlock',
    title: 'Remove Password from PDF Without Software — Free Unlocker',
    description: 'Unlock password protected PDFs online without installing desktop software. Remove print and edit restrictions instantly.',
    toolTitle: 'Unlock Password Protected PDF',
    toolDescription: 'Unlock documents and remove edit restrictions locally.',
    steps: [
      'Select the password protected PDF.',
      'Input the decryption password.',
      'Save the unlocked document with restrictions removed.'
    ],
    faqs: [
      { question: 'Can I unlock a PDF without the owner password?', answer: 'Yes, if you enter the user decryption key, all printing, copying, and modification restrictions are removed permanently.' }
    ]
  },
  {
    slug: 'unlock-password-protected-pdf-online',
    toolId: 'unlock',
    title: 'Unlock Password Protected PDF Online — Free & Secure',
    description: 'Decrypt and remove passwords from secure PDFs online. 100% private client-side decryption.',
    toolTitle: 'Online PDF Unlocker',
    toolDescription: 'Decipher protected PDF documents locally.',
    steps: [
      'Upload the secured PDF file.',
      'Provide the original password.',
      'Save the decrypted document.'
    ],
    faqs: [
      { question: 'Are my passwords secure?', answer: 'Yes. All password entries are evaluated in your local browser sandbox; no inputs are transmitted over the internet.' }
    ]
  },
  {
    slug: 'encrypt-pdf-with-password-online',
    toolId: 'protect',
    title: 'Encrypt PDF with Password Online — Protect PDF Files',
    description: 'Encrypt your PDF documents with highly secure password algorithms online. Prevent unauthorized printing, copying, or editing.',
    toolTitle: 'Encrypt PDF File',
    toolDescription: 'Protect your PDF with custom password encryption.',
    steps: [
      'Select the PDF document to encrypt.',
      'Enter your secure password key.',
      'Download your encrypted PDF.'
    ],
    faqs: [
      { question: 'How is the encryption executed?', answer: 'PDF Section secures document permissions client-side using industry-standard PDF permission encryption keys.' }
    ]
  },
  {
    slug: 'add-password-protection-to-pdf-free',
    toolId: 'protect',
    title: 'Add Password Protection to PDF Free — Secure Documents',
    description: 'Secure sensitive tax files, contracts, and portfolios. Add passwords to your PDFs locally for free.',
    toolTitle: 'Add Password Protection',
    toolDescription: 'Secure your files with client-side permissions.',
    steps: [
      'Upload the file you want to lock.',
      'Define your access password.',
      'Download the secure PDF.'
    ],
    faqs: [
      { question: 'Does anyone else have access to my password?', answer: 'No. The password is compile-hashed locally in your browser memory.' }
    ]
  },
  {
    slug: 'sign-contract-pdf-online-free',
    toolId: 'sign',
    title: 'Sign Contract PDF Online Free — Draw or Upload Signature',
    description: 'Sign legal agreements and contracts online. Draw, type, or upload your signature image directly on PDF pages.',
    toolTitle: 'Sign Contract Online',
    toolDescription: 'Sign contracts and documents locally.',
    steps: [
      'Upload the contract document.',
      'Draw or upload your signature.',
      'Place signature on the signature line and save.'
    ],
    faqs: [
      { question: 'Is my digital signature legally binding?', answer: 'Yes, electronic signatures are legally recognized under the ESIGN Act and eIDAS regulation for general agreements.' }
    ]
  },
  {
    slug: 'digital-signature-pdf-generator',
    toolId: 'sign',
    title: 'Digital Signature PDF Generator — Electronic Signing Tool',
    description: 'Generate signatures and electronically sign business PDFs online. Free client-side signing.',
    toolTitle: 'Electronic Signature Generator',
    toolDescription: 'Sign documents digitally in your browser.',
    steps: [
      'Select your document.',
      'Generate your electronic signature.',
      'Place signature box on the canvas and download.'
    ],
    faqs: [
      { question: 'Are my signatures saved on a database?', answer: 'No. PDF Section stores signature elements locally in your browser cache; they are never uploaded to any cloud database.' }
    ]
  },
  {
    slug: 'permanently-black-out-sensitive-text-in-pdf',
    toolId: 'redact',
    title: 'Permanently Black Out Sensitive Text in PDF — Redact PDF',
    description: 'Redact social security numbers, banking details, and confidential addresses from your PDFs online permanently.',
    toolTitle: 'Black Out Sensitive Text',
    toolDescription: 'Redact and black out confidential text areas permanently.',
    steps: [
      'Upload your document.',
      'Draw redaction rectangles over sensitive text chunks.',
      'Commit redactions to remove text metadata permanently.'
    ],
    faqs: [
      { question: 'Can redacted text be copied or recovered?', answer: 'No. Our redaction engine cuts and deletes the raw document stream under the redaction boxes, preventing recovery.' }
    ]
  },
  {
    slug: 'redact-confidential-information-pdf-online',
    toolId: 'redact',
    title: 'Redact Confidential Information PDF Online — Free & Safe',
    description: 'Secure client-side PDF redaction for developers, legal teams, and corporations. Zero server uploads.',
    toolTitle: 'Redact Confidential Information',
    toolDescription: 'Sanitize corporate and private PDF documents locally.',
    steps: [
      'Select the PDF document.',
      'Mark all fields requiring sanitization.',
      'Download your sanitized PDF.'
    ],
    faqs: [
      { question: 'How is this different from drawing black boxes in normal editors?', answer: 'Normal editors just overlay a black shape, leaving the underlying text searchable. Our tool deletes the text data completely.' }
    ]
  },

  // --- Document Assembly ---
  {
    slug: 'merge-pdf-files-online-free',
    toolId: 'merge',
    title: 'Merge PDF Files Online Free — Combine PDFs Instantly',
    description: 'Combine multiple PDF files into one single document online for free. Drag, drop, and rearrange pages locally.',
    toolTitle: 'Combine PDF Files',
    toolDescription: 'Arrange and combine multiple PDF files into one.',
    steps: [
      'Choose the PDF files to merge.',
      'Rearrange documents or page sequence.',
      'Download the merged PDF.'
    ],
    faqs: [
      { question: 'Can I merge password protected PDFs?', answer: 'Yes, as long as you provide the passwords to decrypt them locally first.' }
    ]
  },
  {
    slug: 'combine-multiple-pdf-into-one',
    toolId: 'merge',
    title: 'Combine Multiple PDF Into One — Free Page Joiner',
    description: 'Join corporate reports, invoice files, and study sheets into a single PDF. Free, fast browser execution.',
    toolTitle: 'Merge PDF Documents',
    toolDescription: 'Join files together instantly.',
    steps: [
      'Add documents you wish to combine.',
      'Reorder templates.',
      'Save the consolidated file.'
    ],
    faqs: [
      { question: 'Is there a limit on how many files I can combine?', answer: 'No limit. You can combine as many files as your device memory supports.' }
    ]
  },
  {
    slug: 'merge-scanned-pdf-pages',
    toolId: 'merge',
    title: 'Merge Scanned PDF Pages — Online Document Combiner',
    description: 'Combine high-resolution scanned sheets into a single document. Quick local browser merging.',
    toolTitle: 'Combine Scanned PDFs',
    toolDescription: 'Consolidate multiple scanned PDF pages.',
    steps: [
      'Drag scanned PDFs into the workspace.',
      'Order pages sequentially.',
      'Download your merged document.'
    ],
    faqs: [
      { question: 'Will merging scanned PDFs decrease resolution?', answer: 'No, the merge tool keeps raw image layers intact, preserving original DPI.' }
    ]
  },
  {
    slug: 'split-pdf-pages-online-free',
    toolId: 'split',
    title: 'Split PDF Pages Online Free — Separate PDF Files',
    description: 'Separate pages from your PDF document online for free. Split large PDFs into individual files or extract custom ranges.',
    toolTitle: 'Split PDF Pages',
    toolDescription: 'Extract ranges or split all pages into separate files.',
    steps: [
      'Upload the PDF you want to split.',
      'Define page ranges or split rules.',
      'Save your separate document packages.'
    ],
    faqs: [
      { question: 'Can I split a PDF into separate single pages?', answer: 'Yes, you can extract every page as an individual single-page PDF.' }
    ]
  },
  {
    slug: 'extract-pages-from-pdf-document',
    toolId: 'split',
    title: 'Extract Pages From PDF Document — Online Extractor',
    description: 'Extract specific pages from a PDF. Build a new PDF with just the selected pages online for free.',
    toolTitle: 'Extract PDF Pages',
    toolDescription: 'Extract chosen pages to build a new document.',
    steps: [
      'Upload your PDF file.',
      'Select pages or input range coordinates.',
      'Extract and save your new file.'
    ],
    faqs: [
      { question: 'Can I delete pages from a PDF this way?', answer: 'Yes, by selecting and extracting only the pages you want to keep.' }
    ]
  },
  {
    slug: 'split-large-pdf-file',
    toolId: 'split',
    title: 'Split Large PDF File — Free Online Tool',
    description: 'Split heavy PDF attachments into smaller separate files for easy email delivery. 100% private browser parsing.',
    toolTitle: 'Split Large PDF Documents',
    toolDescription: 'Parse large files into smaller documents.',
    steps: [
      'Select the large PDF document.',
      'Select page division breakpoints.',
      'Download split files.'
    ],
    faqs: [
      { question: 'What is the file size limit?', answer: 'You can split large files of any size entirely in your local browser window.' }
    ]
  },
  {
    slug: 'rotate-pdf-pages-online-free',
    toolId: 'rotate-pdf',
    title: 'Rotate PDF Pages Online Free — Turn PDF Pages',
    description: 'Permanently rotate upside-down PDF pages 90, 180, or 270 degrees. Save orientation changes client-side for free.',
    toolTitle: 'Rotate PDF Orientation',
    toolDescription: 'Rotate individual pages or all pages.',
    steps: [
      'Upload your PDF file.',
      'Rotate specific pages using clockwise or counterclockwise controls.',
      'Save rotated PDF.'
    ],
    faqs: [
      { question: 'Is page rotation permanent?', answer: 'Yes. The orientation metadata tag is updated inside the PDF structure, so it displays correctly in all reader engines.' }
    ]
  },
  {
    slug: 'change-pdf-page-orientation-permanently',
    toolId: 'rotate-pdf',
    title: 'Change PDF Page Orientation Permanently — Portrait to Landscape',
    description: 'Convert landscape pages to portrait or vice versa. Free online orientation utility.',
    toolTitle: 'Modify Page Orientation',
    toolDescription: 'Fix orientation and layout alignment.',
    steps: [
      'Select portrait/landscape documents.',
      'Align orientation.',
      'Download aligned file.'
    ],
    faqs: [
      { question: 'Does orientation change stretch text?', answer: 'No, pages are rotated cleanly without modifying aspect ratios or stretching text.' }
    ]
  },
  {
    slug: 'crop-pdf-margins-online-free',
    toolId: 'crop-pdf',
    title: 'Crop PDF Margins Online Free — Trim PDF Canvas',
    description: 'Trim margins and crop PDF canvas sizes. Adjust printing boundaries and visible area online for free.',
    toolTitle: 'Crop PDF Margins',
    toolDescription: 'Trim visible boundaries on your document.',
    steps: [
      'Upload the PDF file.',
      'Draw a crop selection rectangle on the page preview.',
      'Click crop and download the trimmed PDF.'
    ],
    faqs: [
      { question: 'Does cropping delete elements outside the box?', answer: 'Yes, it resets the crop boundaries and media dimensions to keep the outer margins hidden.' }
    ]
  },
  {
    slug: 'compare-two-pdf-files-for-differences',
    toolId: 'compare-pdf',
    title: 'Compare Two PDF Files for Differences — Legal Document Comparison',
    description: 'Highlight text and layout changes between two PDF documents. Free client-side legal document comparison.',
    toolTitle: 'Compare PDF Files',
    toolDescription: 'Highlight changes and edits between two documents.',
    steps: [
      'Select the original PDF file.',
      'Select the modified PDF file.',
      'Review differences highlighted in the interactive window.'
    ],
    faqs: [
      { question: 'Is my comparison data secure?', answer: 'Comparison computations occur strictly locally; your proprietary data is kept fully private.' }
    ]
  },

  // --- Conversions ---
  {
    slug: 'convert-docx-to-pdf-online-free',
    toolId: 'word-to-pdf',
    title: 'Convert DOCX to PDF Online Free — Word to PDF',
    description: 'Convert Microsoft Word documents (DOCX, DOC) to PDF format online. Keep layout, formatting, and fonts fully intact.',
    toolTitle: 'Word to PDF Converter',
    toolDescription: 'Convert MS Word docs to PDF locally.',
    steps: [
      'Upload your DOCX file.',
      'Initialize layout rendering.',
      'Download your PDF document.'
    ],
    faqs: [
      { question: 'Does it preserve fonts?', answer: 'Yes, standard system and Google Fonts are embedded to keep layout styling uniform.' }
    ]
  },
  {
    slug: 'convert-pdf-to-editable-word-document',
    toolId: 'pdf-to-word',
    title: 'Convert PDF to Editable Word Document — PDF to DOCX Converter',
    description: 'Convert standard PDF files to editable Microsoft Word DOCX files online. Extract text layers accurately.',
    toolTitle: 'PDF to Word Converter',
    toolDescription: 'Convert PDF files to editable Word formats.',
    steps: [
      'Upload the PDF file.',
      'Initialize text extraction parsing.',
      'Download your editable DOCX file.'
    ],
    faqs: [
      { question: 'Is scanned text extractable?', answer: 'Yes, if the PDF contains readable text streams, they are exported directly to paragraphs in Word.' }
    ]
  },
  {
    slug: 'convert-jpg-images-to-pdf-online',
    toolId: 'jpg-to-pdf',
    title: 'Convert JPG Images to PDF Online — Free Image to PDF',
    description: 'Combine and convert JPG/JPEG photos into a clean PDF document. Drag, drop, and order images locally.',
    toolTitle: 'JPG to PDF Converter',
    toolDescription: 'Convert JPG, JPEG, or PNG images to PDF files.',
    steps: [
      'Upload your image files.',
      'Drag and order the images.',
      'Download the compiled PDF.'
    ],
    faqs: [
      { question: 'Can I add multiple photos?', answer: 'Yes, you can compile dozens of photos into a single paginated document.' }
    ]
  },
  {
    slug: 'convert-pdf-pages-to-jpg-images',
    toolId: 'pdf-to-jpg',
    title: 'Convert PDF Pages to JPG Images — Free PDF to JPG',
    description: 'Export PDF pages as individual high-res JPG images online. 100% free browser-native image extraction.',
    toolTitle: 'PDF to JPG Converter',
    toolDescription: 'Convert PDF document pages to JPG images.',
    steps: [
      'Select the PDF file.',
      'Choose output DPI (resolution).',
      'Download your image archive.'
    ],
    faqs: [
      { question: 'What DPI resolution should I choose?', answer: '150 DPI is standard for web sharing, while 300 DPI is recommended for printing.' }
    ]
  },
  // --- Summaries & Language ---
  // (The PDF/A how-to guide was removed while the PDF/A tool is paused.)
  {
    slug: 'ai-summarize-long-pdf-document',
    toolId: 'summarizer',
    title: 'Summarize a Long PDF Document — Free Key Sentence Summary',
    description: 'Pull the most important sentences out of a long PDF in your browser. Free, with no file upload.',
    toolTitle: 'PDF Summarizer',
    toolDescription: 'Pick out the key sentences from a long PDF, right in your browser.',
    steps: [
      'Open the PDF document.',
      'Choose how many sentences you want in the summary.',
      'Read, copy or download the summary.'
    ],
    faqs: [
      { question: 'How is the summary calculated?', answer: 'The tool scores each sentence by how important its words are and returns the top ones. It picks existing sentences rather than writing new text, and it runs in your browser.' }
    ]
  },
  {
    slug: 'translate-pdf-document-to-hindi-urdu-arabic',
    toolId: 'translate',
    title: 'Translate PDF Document to Hindi, Urdu, Arabic & More',
    description: 'Translate PDF texts online to Hindi, Urdu, Arabic, Spanish, French, and German. Secure browser-native translation.',
    toolTitle: 'PDF Language Translator',
    toolDescription: 'Translate PDF files to other languages.',
    steps: [
      'Select the target PDF file.',
      'Select target translation language.',
      'Download the translated text.'
    ],
    faqs: [
      { question: 'Are right-to-left layout directions supported?', answer: 'Yes, the engine automatically formats Urdu and Arabic outputs with RTL (Right-to-Left) alignment.' }
    ]
  }
];
