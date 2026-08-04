'use client';

import dynamic from 'next/dynamic';

// Dynamically import all client tool components for performance optimization
const MergePDFClient = dynamic(() => import('@/app/merge-pdf/MergePDFClient'), { ssr: false });
const SplitPDFClient = dynamic(() => import('@/app/split-pdf/SplitPDFClient'), { ssr: false });
const CompressPDFClient = dynamic(() => import('@/app/compress-pdf/CompressPDFClient'), { ssr: false });
const PDFToJPGClient = dynamic(() => import('@/app/pdf-to-jpg/PDFToJPGClient'), { ssr: false });
const JPGToPDFClient = dynamic(() => import('@/app/jpg-to-pdf/JPGToPDFClient'), { ssr: false });
const RotatePDFClient = dynamic(() => import('@/app/rotate-pdf/RotatePDFClient'), { ssr: false });
const AddPageNumbersClient = dynamic(() => import('@/app/add-page-numbers/AddPageNumbersClient'), { ssr: false });
const WatermarkPDFClient = dynamic(() => import('@/app/add-watermark/WatermarkPDFClient'), { ssr: false });
const CropPDFClient = dynamic(() => import('@/app/crop-pdf/CropPDFClient'), { ssr: false });
const EditPDFClient = dynamic(() => import('@/app/edit-pdf/EditPDFClient'), { ssr: false });
const UnlockPDFClient = dynamic(() => import('@/app/unlock-pdf/UnlockPDFClient'), { ssr: false });
const ProtectPDFClient = dynamic(() => import('@/app/protect-pdf/ProtectPDFClient'), { ssr: false });
const SignPDFClient = dynamic(() => import('@/app/sign-pdf/SignPDFClient'), { ssr: false });
const RedactPDFClient = dynamic(() => import('@/app/redact-pdf/RedactPDFClient'), { ssr: false });
const ComparePDFClient = dynamic(() => import('@/app/compare-pdf/ComparePDFClient'), { ssr: false });
const AISummarizerClient = dynamic(() => import('@/app/ai-summarizer/AISummarizerClient'), { ssr: false });
const TranslatePDFClient = dynamic(() => import('@/app/translate-pdf/TranslatePDFClient'), { ssr: false });
const BatesNumberingPDFClient = dynamic(() => import('@/app/bates-numbering-pdf/BatesNumberingPDFClient'), { ssr: false });
const GrayscalePDFClient = dynamic(() => import('@/app/grayscale-pdf/GrayscalePDFClient'), { ssr: false });
const PDFToPDFAClient = dynamic(() => import('@/app/pdf-to-pdfa/PDFToPDFAClient'), { ssr: false });

// Helper wrappers
const OfficeToPDFClient = dynamic(() => import('@/components/OfficeToPDFClient'), { ssr: false });
const PDFToOfficeClient = dynamic(() => import('@/components/PDFToOfficeClient'), { ssr: false });

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
