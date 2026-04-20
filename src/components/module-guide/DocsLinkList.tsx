import React from 'react';
import { useModuleContext } from '../../contexts/ModuleContext';
import { useResolvedContent } from '../../hooks/useResolvedContent';
import { Info, FileText, ExternalLink } from 'lucide-react';

type DocLink = { label: string; href: string };

/**
 * Renders `guide.docs.links[]` as a clean link list.
 *
 * US-MF-2100 — supports inline OR `{ $src: "..." }` externalised links.
 */
const DocsLinkList: React.FC = () => {
  const { manifest, moduleId, loading } = useModuleContext();
  const {
    data: resolvedLinks,
    loading: resolving,
    error: resolveError,
  } = useResolvedContent<DocLink[]>(
    manifest?.guide?.docs?.links as DocLink[] | { $src: string } | undefined,
    manifest?.version,
  );
  const links: DocLink[] = resolvedLinks || [];

  if (loading || resolving) return <div className="p-6 text-gray-500 text-sm">Loading docs…</div>;

  if (resolveError) {
    const srcUrl = (manifest?.guide?.docs?.links as { $src?: string } | undefined)?.$src;
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-5 flex gap-3 items-start">
          <Info className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="font-semibold text-red-900 dark:text-red-200">Docs failed to load</h2>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">{resolveError.message}</p>
            {srcUrl && (
              <p className="text-[11px] font-mono text-red-700 dark:text-red-400 mt-2 break-all">
                $src = {srcUrl}
              </p>
            )}
            <p className="text-[11px] text-red-700 dark:text-red-400 mt-1">
              Manifest path: <code>guide.docs.links</code> on module <code>{moduleId || '?'}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-5 flex gap-3 items-start">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="font-semibold text-amber-900 dark:text-amber-200">Docs not supplied</h2>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
              Module <code className="font-mono">{moduleId || '?'}</code> did not declare <code>guide.docs</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Resources</h1>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {links.map((l, i) => {
          const isExternal = /^https?:\/\//.test(l.href);
          return (
            <a
              key={i}
              href={l.href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-600 dark:text-indigo-400" size={18} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{l.label}</div>
                  <div className="text-[11px] font-mono text-gray-500 break-all">{l.href}</div>
                </div>
              </div>
              <ExternalLink size={14} className="text-gray-400 shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default DocsLinkList;
