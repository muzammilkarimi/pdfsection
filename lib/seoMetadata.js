export const SEO_TOOL_CONTENT = {
  'merge-pdf': {
    steps: [
      'Select and upload the PDF files you want to combine.',
      'Drag and drop the file cards to arrange them in your preferred sequence.',
      'Click the "Merge PDF" button to process and download your merged document instantly.'
    ],
    benefits: [
      '100% Client-Side Privacy: Your files never leave your device or get sent to remote servers.',
      'Zero Wait Times: Process large document batches in milliseconds without network upload lag.',
      'Unlimited Merges: Combine as many PDFs as you need completely free of charge.'
    ],
    useCases: [
      'Consolidating job application packages (Resume, Cover Letter, Certificates).',
      'Combining monthly invoices and receipts into single accounting files.',
      'Merging multi-part lease agreements or contract attachments into one document.'
    ],
    faqs: [
      {
        q: 'Is there a limit on the number of PDFs I can merge?',
        a: 'You can merge up to 20 PDF files at once. All merging happens directly in your browser, so there are no file queues or upload limits.'
      },
      {
        q: 'Can I reorder the pages or files before merging?',
        a: 'Yes, you can drag and drop the PDF file cards in the workspace to arrange the exact document order before compiling.'
      },
      {
        q: 'Are my private files safe when merging online?',
        a: 'Absolutely. PDF Section compiles files 100% locally in your browser memory. Your documents are never uploaded to any cloud server.'
      }
    ]
  },
  'split-pdf': {
    steps: [
      'Choose the PDF file you want to separate into individual documents.',
      'Select whether to extract custom page ranges or split every page into separate files.',
      'Click "Split PDF" and download your extracted pages inside a single ZIP file.'
    ],
    benefits: [
      'Flexible Extraction: Choose specific ranges (e.g. 1-3, 5) or extract all pages as individual files.',
      'Private & Secure: Document parsing happens 100% inside your local browser tab.',
      'Fast ZIP Packaging: Download all separated documents in one organized ZIP archive.'
    ],
    useCases: [
      'Extracting single chapters or contract sections from oversized books and reports.',
      'Separating multi-page scanned documents into individual customer invoices.',
      'Removing unnecessary cover pages or appendix sections prior to emailing.'
    ],
    faqs: [
      {
        q: 'How does splitting a PDF work locally?',
        a: 'Our tool reads the PDF binary data inside your browser tab and extracts selected pages into new PDF files. Your document never uploads to any server.'
      },
      {
        q: 'Can I select non-consecutive page ranges?',
        a: 'Yes, you can enter custom ranges (e.g., "1-3, 5, 8-10") to extract only the exact pages you need.'
      },
      {
        q: 'Is my document quality preserved during splitting?',
        a: 'Yes. Pages are extracted directly at the binary stream level, ensuring text, vector art, and images remain 100% pixel-perfect.'
      }
    ]
  },
  'compress-pdf': {
    steps: [
      'Select the oversized PDF document you need to shrink.',
      'Choose your target compression level (Recommended, Extreme, or Low compression).',
      'Click "Compress PDF" and download your optimized smaller file immediately.'
    ],
    benefits: [
      'Email-Ready Size: Reduce large PDFs to fit Gmail (25MB) and Outlook (20MB) attachment caps.',
      'Smart Downsampling: Shrink file size by up to 80% while keeping text sharp and legible.',
      'Client-Side Speed: Optimize documents in seconds without waiting for server uploads.'
    ],
    useCases: [
      'Shrinking heavy scanned PDF forms to fit email attachment limits.',
      'Optimizing image-heavy portfolios and presentation slides for fast web distribution.',
      'Reducing storage space required for archiving digital invoices and contracts.'
    ],
    faqs: [
      {
        q: 'Will my PDF lose readability or quality during compression?',
        a: 'Our "Recommended" compression preset strikes the perfect balance, shrinking file size by optimizing metadata and downsampling images while keeping text razor sharp.'
      },
      {
        q: 'Is the file compression secure?',
        a: 'Yes, compression runs 100% client-side inside your browser tab. File size reduction is computed locally using your own hardware.'
      },
      {
        q: 'How much file size reduction can I expect?',
        a: 'Depending on the embedded images and metadata inside your original file, compression typically reduces file size between 30% and 80%.'
      }
    ]
  },
  'edit-pdf': {
    steps: [
      'Upload your PDF document into the interactive editor canvas.',
      'Add new text, images, shapes, highlight boxes, or whiteout existing text.',
      'Click "Export PDF" to compile your edits into a fresh downloadable PDF.'
    ],
    benefits: [
      'Full Editing Suite: Add text boxes, signature stamps, images, shapes, and erase markings.',
      'Interactive Canvas: Drag, resize, and reposition elements visually with pixel precision.',
      'No Acrobat License Required: Edit your documents free of charge without buying software.'
    ],
    useCases: [
      'Filling out PDF forms and contracts directly inside your web browser.',
      'Adding annotations, notes, and visual highlights to study guides or reports.',
      'Whiteout/erasing unwanted text or images before sharing documents.'
    ],
    faqs: [
      {
        q: 'Can I whiteout or cover up existing text on my PDF?',
        a: 'Yes! You can add whiteout erase boxes or select paragraph text blocks to cover existing content and type new text directly over it.'
      },
      {
        q: 'Does editing require uploading my document to a server?',
        a: 'No. All canvas rendering and PDF compiling happen locally inside your browser memory using HTML5 canvas and JavaScript.'
      }
    ]
  },
  'sign-pdf': {
    steps: [
      'Drop your PDF contract or agreement into the signing workspace.',
      'Draw your signature with mouse/touchpad or type your name using cursive fonts.',
      'Stamp your signature onto document pages, adjust position, and download the signed PDF.'
    ],
    benefits: [
      'Legally Binding: Electronic signatures stamped on PDFs comply with ESIGN Act & eIDAS rules.',
      'Draw or Type Options: Create custom signatures by drawing or using elegant cursive styles.',
      '100% Private Signature: Your personal signature stamp is never stored on external databases.'
    ],
    useCases: [
      'Signing lease agreements, employment contracts, and NDA documents.',
      'Adding approval signatures to purchase orders and vendor invoices.',
      'Authorizing tax returns and official application forms.'
    ],
    faqs: [
      {
        q: 'Can I move or delete signature stamps after placing them?',
        a: 'Yes! You can drag and drop any placed signature stamp to adjust alignment, resize it, or click delete if you make a mistake.'
      },
      {
        q: 'Are electronic signatures created here legally binding?',
        a: 'Yes, electronic signatures created in client-side tools are legally binding for the vast majority of personal and commercial agreements under ESIGN and eIDAS regulations.'
      }
    ]
  },
  'protect-pdf': {
    steps: [
      'Choose the PDF document you want to secure with password encryption.',
      'Type in your password and confirm it in the password input field.',
      'Click "Encrypt PDF" to apply 128-bit AES protection and download your locked file.'
    ],
    benefits: [
      'High Security Encryption: Locks your document using industry-standard AES encryption.',
      'Zero Cloud Risk: Your password and document are processed locally and never sent over the web.',
      'Universal Compatibility: Encrypted files open seamlessly in Adobe Reader and all browsers.'
    ],
    useCases: [
      'Securing confidential financial statements before emailing accountants.',
      'Password-protecting sensitive HR records, tax forms, and medical histories.',
      'Locking client contracts to restrict unauthorized reading or viewing.'
    ],
    faqs: [
      {
        q: 'Is it safe to password protect files online?',
        a: 'Because PDF Section operates 100% inside your local browser tab, your password and files are processed locally. Your secret password is never sent to any server.'
      },
      {
        q: 'What encryption standard is used?',
        a: 'We use standard 128-bit AES encryption to lock and password-protect your documents, compatible with Adobe Acrobat and all standard PDF readers.'
      }
    ]
  },
  'unlock-pdf': {
    steps: [
      'Upload the password-protected PDF document.',
      'Type in the correct decryption password for the file.',
      'Click "Decrypt PDF" to remove security restrictions and download an unlocked copy.'
    ],
    benefits: [
      'Remove Restrictions: Unlocks files for unrestricted reading, editing, and printing.',
      'Instant Local Decryption: Decrypts files in seconds inside local browser memory.',
      'Privacy Guaranteed: Password inputs are wiped from memory as soon as you close the tab.'
    ],
    useCases: [
      'Removing passwords from monthly bank statements for easier archiving.',
      'Unlocking team files to enable printing or merging with other reports.',
      'Removing view restrictions from authorized password-protected documents.'
    ],
    faqs: [
      {
        q: 'Can I unlock a PDF if I forgot the password?',
        a: 'No. For security and privacy reasons, decryption requires providing the original valid password.'
      },
      {
        q: 'Does this save my document password?',
        a: 'Never. All inputs are processed entirely inside your local browser memory and are wiped when you close the tab.'
      }
    ]
  },
  'ocr-pdf': {
    steps: [
      'Upload your scanned PDF document or image file.',
      'Click "Run OCR Page Scanning" to launch character recognition.',
      'Copy the extracted text output or download it as a text file.'
    ],
    benefits: [
      'Browser-Native OCR: Powered by Tesseract WebAssembly engine running on your machine.',
      'Extract Non-Selectable Text: Turn flat image pixels into copyable, searchable text.',
      '100% Private Extraction: Your scanned contracts and notes never touch third-party servers.'
    ],
    useCases: [
      'Converting scanned book pages, paper receipts, and invoices into editable text.',
      'Extracting text from image-only PDFs to enable Ctrl+F keyword searching.',
      'Digitizing legacy paper archives into searchable plain text files.'
    ],
    faqs: [
      {
        q: 'How does client-side OCR work?',
        a: 'Our tool uses Tesseract.js compiled to WebAssembly. It analyzes page canvas pixels directly in your browser and extracts text characters without sending image data over the network.'
      },
      {
        q: 'Can OCR recognize handwritten text?',
        a: 'OCR is optimized for printed fonts (scanned documents, books, typed invoices). Clear handwriting may work, but typed text yields the highest accuracy.'
      }
    ]
  },
  'redact-pdf': {
    steps: [
      'Upload the PDF file containing confidential text or numbers.',
      'Drag selection boxes over sensitive text, addresses, or account details.',
      'Click "Apply Redactions" to permanently erase underlying text streams and download.'
    ],
    benefits: [
      'True Data Destruction: Removes underlying text nodes from the file binary, not just visual boxes.',
      'Permanent Blackout: Bakes solid vector blackout boxes into the canvas output.',
      'Privacy Compliance: Protects sensitive personal data for GDPR, HIPAA, and legal filings.'
    ],
    useCases: [
      'Blacking out Social Security Numbers, phone numbers, and bank account numbers.',
      'Sanitizing legal evidence and court filings prior to public submission.',
      'Removing private client details from case studies and business reports.'
    ],
    faqs: [
      {
        q: 'Is this true redaction or just drawing black boxes?',
        a: 'This is true redaction! Our tool strips away the underlying text nodes from the PDF stream so text cannot be copied or highlighted underneath.'
      },
      {
        q: 'Can someone undo redactions after downloading?',
        a: 'No. Once applied and downloaded, the redacted text content is permanently erased from the document structure.'
      }
    ]
  }
};

export const DEFAULT_SEO_CONTENT = {
  steps: [
    'Drag and drop your file into the tool workspace above.',
    'Configure your editing preferences (pages, passwords, formats, or layouts).',
    'Click the primary action button to process and download your file instantly.'
  ],
  benefits: [
    '100% Private & Browser-Only: Your files never leave your device or upload to cloud servers.',
    'Instant Speed: No network upload bottlenecks or server queues.',
    '100% Free: Unlimited usage with zero forced registrations or hidden fees.'
  ],
  useCases: [
    'Preparing professional documents for job applications, business reports, and legal filings.',
    'Managing personal records, tax forms, financial statements, and academic papers.',
    'Optimizing and organizing PDF files for fast email sharing and web viewing.'
  ],
  faqs: [
    {
      q: 'Is PDF Section really free to use?',
      a: 'Yes! PDF Section is 100% free with no hidden charges, daily usage limits, or forced user registrations.'
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Absolutely not. PDF Section operates entirely client-side. All processing happens in your browser and your files never leave your device.'
    },
    {
      q: 'Does it work on mobile devices?',
      a: 'Yes, our web application is fully responsive and compatible with Windows, Mac, iOS, Android, and Linux browsers.'
    }
  ]
};
