'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ToolIcon } from '@/components/Icons';
import { listLibrary, deleteFromLibrary, clearLibrary } from '@/lib/fileLibrary';
import { setIncomingFiles } from '@/lib/incomingFiles';
import { formatBytes } from '@/lib/fileInsights';
import { downloadBlob } from '@/lib/pdfUtils';
import { usePref } from '@/lib/preferences';
import { ALL_TOOLS } from '@/lib/tools';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function toolFor(slug) {
  return ALL_TOOLS.find((tool) => tool.route === `/${slug}`);
}

export default function FilesClient() {
  const router = useRouter();
  const rememberFiles = usePref('rememberFiles');
  const keepDays = usePref('keepDays');
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [files, setFiles] = useState([]);

  const refresh = useCallback(() => {
    return listLibrary()
      .then((entries) => {
        setFiles(entries);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id) => {
    await deleteFromLibrary(id);
    refresh();
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all saved files from this browser?')) return;
    await clearLibrary();
    refresh();
  };

  const openInTool = (entry) => {
    setIncomingFiles([new File([entry.blob], entry.filename, { type: entry.mime })]);
    router.push('/');
  };

  const totalBytes = files.reduce((sum, entry) => sum + entry.size, 0);

  return (
    <main className="main">
      <div className="account-page container">
        <div className="account-page-head">
          <div>
            <h1>Your files</h1>
            <p>Files you made recently. They stay in this browser and nowhere else.</p>
          </div>
          <div className="account-page-actions">
            <Link href="/settings" className="btn btn-secondary">Storage settings</Link>
            {files.length > 0 && (
              <button type="button" className="btn btn-danger-soft" onClick={handleClearAll}>Clear all</button>
            )}
          </div>
        </div>

        {!rememberFiles ? (
          <div className="account-banner">
            <ToolIcon name="lock" size={18} />
            <span>
              Saving files is turned off, so nothing new is kept here. <Link href="/settings">Turn it on in Settings</Link>.
            </span>
          </div>
        ) : (
          files.length > 0 && (
            <div className="account-banner">
              <ToolIcon name="lock" size={18} />
              <span>
                <strong>{files.length} file{files.length === 1 ? '' : 's'} · {formatBytes(totalBytes)} in this browser.</strong>{' '}
                Anyone using this browser profile can see them. Files older than {keepDays} day{keepDays === 1 ? '' : 's'} are removed.
              </span>
            </div>
          )
        )}

        {status === 'error' && (
          <div className="home-empty-state">
            <ToolIcon name="folder" size={42} />
            <strong>Your files can&apos;t be shown</strong>
            <span>This browser is blocking site storage, for example in a private window.</span>
          </div>
        )}

        {status === 'ready' && files.length === 0 && (
          <div className="home-empty-state">
            <ToolIcon name="folder" size={42} />
            <strong>No files yet</strong>
            <span>
              Files you make with any tool show up here. <Link href="/tools">Pick a tool</Link>.
            </span>
          </div>
        )}

        {files.length > 0 && (
          <div className="files-table-wrap">
            <table className="files-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Made with</th>
                  <th scope="col">Size</th>
                  <th scope="col">When</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {files.map((entry) => {
                  const tool = toolFor(entry.tool);
                  return (
                    <tr key={entry.id}>
                      <td>
                        <span className="files-name">
                          <span className="files-ext">{entry.filename.split('.').pop().toUpperCase()}</span>
                          <span>{entry.filename}</span>
                        </span>
                      </td>
                      <td>
                        {tool && (
                          <span
                            className="files-tool"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${tool.categoryColor} 14%, var(--surface-2))`,
                              color: tool.categoryColor,
                            }}
                          >
                            {tool.name}
                          </span>
                        )}
                      </td>
                      <td>{formatBytes(entry.size)}</td>
                      <td>{dateFormat.format(entry.createdAt)}</td>
                      <td>
                        <span className="files-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => downloadBlob(entry.blob, entry.filename, entry.mime)}
                          >
                            Download
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => openInTool(entry)}>
                            Use in a tool
                          </button>
                          <button
                            type="button"
                            className="files-delete"
                            onClick={() => handleDelete(entry.id)}
                            aria-label={`Delete ${entry.filename}`}
                          >
                            <ToolIcon name="trash" size={16} />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
