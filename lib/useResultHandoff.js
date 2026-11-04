'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveResult } from '@/lib/resultStore';
import { addToLibrary } from '@/lib/fileLibrary';

/**
 * Returns deliver(data, filename, mime, meta). It stores the finished file and opens
 * this tool's download page (/download/<tool>) instead of downloading immediately.
 * `data` may be bytes, a Blob, or a pdf-lib PDFDocument.
 */
export function useResultHandoff(tool) {
  const router = useRouter();

  return useCallback(
    async (data, filename, mime = 'application/pdf', meta = {}) => {
      const payload = typeof data?.save === 'function' ? await data.save() : data;
      const saved = await saveResult({ tool, data: payload, filename, mime, meta });
      // The Files page copy is best-effort: a full or blocked store must not stop the download.
      addToLibrary({ tool, blob: saved.blob, filename, mime: saved.mime, meta }).catch(() => {});
      router.push(`/download/${tool}`);
    },
    [tool, router]
  );
}
