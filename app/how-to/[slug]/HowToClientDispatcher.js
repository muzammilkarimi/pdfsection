'use client';

import dynamic from 'next/dynamic';

// Code-split each tool, but keep server rendering on so the H1, steps and FAQ are in the HTML crawlers receive
const MergePDFClient = dynamic(() => import('@/app/merge-pdf/MergePDFClient'));
const SplitPDFClient = dynamic(() => import('@/app/split-pdf/SplitPDFClient'));
const CompressPDFClient = dynamic(() => import('@/app/compress-pdf/CompressPDFClient'));
const PDFToJPGClient = dynamic(() => import('@/app/pdf-to-jpg/PDFToJPGClient'));
const JPGToPDFClient = dynamic(() => import('@/app/jpg-to-pdf/JPGToPDFClient'));
const RotatePDFClient = dynamic(() => import('@/app/rotate-pdf/RotatePDFClient'));
const AddPageNumbersClient = dynamic(() => import('@/app/add-page-numbers/AddPageNumbersClient'));
const WatermarkPDFClient = dynamic(() => import('@/app/add-watermark/WatermarkPDFClient'));
const CropPDFClient = dynamic(() => import('@/app/crop-pdf/CropPDFClient'));
const EditPDFClient = dynamic(() => import('@/app/edit-pdf/EditPDFClient'));
const UnlockPDFClient = dynamic(() => import('@/app/unlock-pdf/UnlockPDFClient'));
const ProtectPDFClient = dynamic(() => import('@/app/protect-pdf/ProtectPDFClient'));
const SignPDFClient = dynamic(() => import('@/app/sign-pdf/SignPDFClient'));
const RedactPDFClient = dynamic(() => import('@/app/redact-pdf/RedactPDFClient'));
const ComparePDFClient = dynamic(() => import('@/app/compare-pdf/ComparePDFClient'));
const AISummarizerClient = dynamic(() => import('@/app/ai-summarizer/AISummarizerClient'));
const TranslatePDFClient = dynamic(() => import('@/app/translate-pdf/TranslatePDFClient'));
const BatesNumberingPDFClient = dynamic(() => import('@/app/bates-numbering-pdf/BatesNumberingPDFClient'));
const GrayscalePDFClient = dynamic(() => import('@/app/grayscale-pdf/GrayscalePDFClient'));
const PDFToPDFAClient = dynamic(() => import('@/app/pdf-to-pdfa/PDFToPDFAClient'));

// Helper wrappers
const OfficeToPDFClient = dynamic(() => import('@/components/OfficeToPDFClient'));
const PDFToOfficeClient = dynamic(() => import('@/components/PDFToOfficeClient'));

export default function HowToClientDispatcher({ toolId }) {
  switch (toolId) {
    case 'merge':
      return <MergePDFClient />;
    case 'split':
      return <SplitPDFClient />;
    case 'compress':
      return <CompressPDFClient />;
    case 'pdf-to-jpg':
      return <PDFToJPGClient />;
    case 'jpg-to-pdf':
      return <JPGToPDFClient />;
    case 'rotate-pdf':
      return <RotatePDFClient />;
    case 'page-numbers':
      return <AddPageNumbersClient />;
    case 'watermark':
      return <WatermarkPDFClient />;
    case 'crop-pdf':
      return <CropPDFClient />;
    case 'edit':
      return <EditPDFClient />;
    case 'unlock':
      return <UnlockPDFClient />;
    case 'protect':
      return <ProtectPDFClient />;
    case 'sign':
      return <SignPDFClient />;
    case 'redact':
      return <RedactPDFClient />;
    case 'compare-pdf':
      return <ComparePDFClient />;
    case 'summarizer':
      return <AISummarizerClient />;
    case 'translate':
      return <TranslatePDFClient />;
    case 'bates-numbering-pdf':
      return <BatesNumberingPDFClient />;
    case 'grayscale-pdf':
      return <GrayscalePDFClient />;
    case 'pdf-to-pdfa':
      return <PDFToPDFAClient />;
    case 'word-to-pdf':
      return <OfficeToPDFClient toolId="word-to-pdf" />;
    case 'pdf-to-word':
      return <PDFToOfficeClient toolId="pdf-to-word" />;
    default:
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Tool configuration not found.</h3>
        </div>
      );
  }
}
