'use client';

import { useEffect, useState } from 'react';
import ToolPageLayout from '@/components/ToolPageLayout';
import { registerDesignFonts } from '@/lib/designFonts';
import DesignStart from './DesignStart';
import DesignEditor from './DesignEditor';

export default function CreatePDFClient() {
  const [design, setDesign] = useState(null);

  useEffect(() => {
    registerDesignFonts();
  }, []);

  return (
    <ToolPageLayout
      title="Create PDF & Poster Maker"
      description="Design posters, flyers, certificates and documents from scratch, then download a print-ready PDF. Everything runs in your browser. Nothing is uploaded, no account needed."
      icon="create"
      iconColor="var(--tool-edit)"
      showHeader={!design}
      layoutMode={design ? 'app-fixed' : 'page-scroll'}
    >
      {design ? (
        <DesignEditor key={design.id} initial={design} onExit={() => setDesign(null)} />
      ) : (
        <DesignStart onOpen={setDesign} />
      )}
    </ToolPageLayout>
  );
}
