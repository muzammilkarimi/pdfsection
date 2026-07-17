export const SEO_TOOL_CONTENT = {
  'merge-pdf': {
    steps: [
      'Select and upload the PDF files you want to combine.',
      'Drag and drop the file cards to arrange them in your desired order.',
      'Click the "Merge PDF" button to process and download the combined document instantly.'
    ],
    faqs: [
      {
        q: 'Is there a limit on the number of PDFs I can merge?',
        a: 'You can merge up to 20 PDF files at once. All merging happens directly in your browser, so there are no wait times or upload queues.'
      },
      {
        q: 'Can I reorder the pages after uploading?',
        a: 'Yes, you can drag and drop the PDF cards in the workspace to arrange the exact order of documents before compiling.'
      }
    ]
  },
  'split-pdf': {
    steps: [
      'Choose the PDF file you want to split into individual documents.',
      'Select whether to extract custom page ranges or split every single page into separate files.',
      'Click the "Split PDF" button and download your split pages in a single ZIP folder.'
    ],
    faqs: [
      {
        q: 'How does splitting a PDF work locally?',
        a: 'Our tool reads the PDF binary data inside your browser tab and extracts selected pages into new PDF files. Your document never uploads to any server.'
      },
      {
        q: 'Can I select non-consecutive page ranges?',
        a: 'Yes, you can enter custom ranges (e.g., "1-3, 5, 8-10") to extract only the exact pages you need.'
      }
    ]
  },
  'compress-pdf': {
    steps: [
      'Select the PDF file you want to optimize.',
      'Choose your preferred compression level (Recommended, Extreme, or Low compression).',
      'Click "Compress PDF" and download the optimized smaller file immediately.'
    ],
    faqs: [
      {
        q: 'Will my PDF lose readability or quality during compression?',
        a: 'Our "Recommended" compression level strikes the perfect balance, shrinking file size by reducing metadata and optimizing images while keeping text perfectly sharp.'
      },
      {
        q: 'Is the file compression secure?',
        a: 'Yes, the compression is 100% client-side. The file size reduction is computed entirely in your browser using local resources.'
      }
    ]
  },
  'sign-pdf': {
    steps: [
      'Drop your PDF document into the signing workspace.',
      'Draw your signature with your mouse/touchpad, or type your name using elegant cursive fonts.',
      'Position the signature stamp on the pages, adjust its position, and download the signed PDF.'
    ],
    faqs: [
      {
        q: 'Can I move or delete signature stamps after placing them?',
        a: 'Yes! You can drag and drop any placed signature stamp to adjust its alignment, or click the red "✕" button on the stamp to delete it.'
      },
      {
        q: 'Are my signatures legally binding?',
        a: 'Yes, electronic signatures created in browser tools are generally legally binding under laws like the ESIGN Act and eIDAS, depending on the transaction type and local jurisdiction.'
      }
    ]
  },
  'protect-pdf': {
    steps: [
      'Choose the PDF document you want to secure.',
      'Type in your password and verify it in the input fields.',
      'Click "Encrypt PDF" to protect your document with high-security passwords.'
    ],
    faqs: [
      {
        q: 'Is it safe to password protect files online?',
        a: 'Because PDF Section executes entirely inside your browser tab, your password and files are processed locally. Your password is never sent to any server.'
      },
      {
        q: 'What encryption level is used?',
        a: 'We use standard 128-bit AES encryption to lock and password-protect your documents, which is compatible with Adobe Acrobat and all standard PDF readers.'
      }
    ]
  },
  'unlock-pdf': {
    steps: [
      'Drag and drop the password-protected PDF file.',
      'Enter the correct decryption password for the document.',
      'Click "Decrypt PDF" to remove security attributes and download an unlocked copy.'
    ],
    faqs: [
      {
        q: 'Can I unlock a PDF if I forgot the password?',
        a: 'No, for security and privacy reasons, our tool decrypts the file using standard algorithms and requires you to provide the original password.'
      },
      {
        q: 'Does this save the password?',
        a: 'Never. All inputs are processed entirely inside your local browser memory and are wiped when you close the tab.'
      }
    ]
  },
  'ai-summarizer': {
    steps: [
      'Upload the PDF document you want summarized.',
      'Choose whether to extract key takeaways, structural sections, or a bulleted summary.',
      'Read and copy the generated AI summary.'
    ],
    faqs: [
      {
        q: 'How does the PDF AI Summarizer read documents?',
        a: 'Our local summary extractor parses the text nodes on each page and compiles a concise digest using clean summarization layouts.'
      },
      {
        q: 'Are my documents safe from training AI?',
        a: 'Yes, your files stay within your device and are never fed into external models for training.'
      }
    ]
  }
};

export const DEFAULT_SEO_CONTENT = {
  steps: [
    'Drag and drop your file into the tool workspace above.',
    'Configure your editing preferences (pages, passwords, formats, or layouts).',
    'Click the primary conversion button to process and download your file instantly.'
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
