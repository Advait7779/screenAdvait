import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Folder,
  FolderOpen,
  HardDrive,
  Image,
  Loader2,
  Maximize2,
  X,
} from 'lucide-react';

interface GalleryItem {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  captured_at: string;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  retry_count?: number;
  error_message?: string | null;
}

interface DayGroup {
  key: string;
  title: string;
  items: GalleryItem[];
}

function dayKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayTitle(key: string, value: string) {
  const today = dayKey(new Date().toISOString());
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
  return key === today ? `Today — ${formatted}` : formatted;
}

const GalleryThumbnail: React.FC<{
  item: GalleryItem;
  source?: string;
  onRequest: (id: string) => void;
}> = ({ item, source, onRequest }) => {
  useEffect(() => {
    if (!source) void onRequest(item.id);
  }, [item.id, onRequest, source]);

  return (
    <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
      {source ? (
        <img src={source} alt={item.file_name} className="h-full w-full object-cover" />
      ) : (
        <Image className="h-7 w-7 text-gray-300" />
      )}
    </div>
  );
};

export const GalleryPage: React.FC = () => {
  const [queue, setQueue] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'OFFLINE'>('ALL');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const thumbnailRequests = useRef(new Set<string>());
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [fullPreview, setFullPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const items = (await window.electronAPI.getGalleryScreenshots()) as GalleryItem[];
        if (!active) return;
        setQueue(items);
        if (items.length > 0) {
          const newestDay = dayKey(items[0].captured_at);
          setExpandedDays((current) => (current.size > 0 ? current : new Set([newestDay])));
        }
      } catch {
        if (active) setQueue([]);
      }
    };
    void load();
    const timer = window.setInterval(load, 5_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groups = useMemo<DayGroup[]>(() => {
    const matching = queue.filter((item) => {
      if (filter === 'COMPLETED') return item.status === 'COMPLETED';
      if (filter === 'OFFLINE') return item.status !== 'COMPLETED';
      return true;
    });
    const grouped = new Map<string, GalleryItem[]>();
    for (const item of matching) {
      const key = dayKey(item.captured_at);
      const existing = grouped.get(key) || [];
      existing.push(item);
      grouped.set(key, existing);
    }
    return Array.from(grouped.entries()).map(([key, items]) => ({
      key,
      title: dayTitle(key, items[0].captured_at),
      items,
    }));
  }, [filter, queue]);

  const requestThumbnail = useCallback(async (id: string) => {
    if (thumbnailRequests.current.has(id)) return;
    thumbnailRequests.current.add(id);
    try {
      const source = await window.electronAPI.getScreenshotThumbnail(id);
      if (source) setThumbnails((current) => ({ ...current, [id]: source }));
    } finally {
      thumbnailRequests.current.delete(id);
    }
  }, []);

  const toggleDay = (key: string) => {
    setExpandedDays((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const closePreview = useCallback(() => {
    setSelected(null);
    setFullPreview(null);
    setPreviewLoading(false);
  }, []);

  const openPreview = async (item: GalleryItem) => {
    setSelected(item);
    setFullPreview(null);
    setPreviewLoading(true);
    const source = await window.electronAPI.getScreenshotPreview(item.id);
    setFullPreview(source);
    setPreviewLoading(false);
  };

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePreview();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closePreview, selected]);

  return (
    <div className="space-y-5 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Screenshot Gallery</h2>
          <p className="text-xs text-gray-500 mt-0.5">Daily capture folders with compact previews</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span className="font-medium">Records per page:</span>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-green-600 text-gray-800 text-xs font-semibold rounded-md px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-all outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <span>{pageSize} records</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180 text-green-700' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 page-fade-in">
                  {[10, 15, 20, 25].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setPageMap({});
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                        pageSize === size
                          ? 'bg-green-50 text-green-800 font-bold'
                          : 'text-gray-700 hover:bg-green-50/70 hover:text-green-900'
                      }`}
                    >
                      <span>{size} records</span>
                      {pageSize === size && <Check className="w-3.5 h-3.5 text-green-700 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-white border border-gray-200 p-1 rounded-md shadow-sm">
            {[
              ['ALL', 'All Captures'],
              ['COMPLETED', 'Uploaded'],
              ['OFFLINE', 'Offline Queue'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as typeof filter)}
                style={filter === value ? { background: 'linear-gradient(135deg, #15803d, #166534)' } : undefined}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filter === value ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => {
            const expanded = expandedDays.has(group.key);
            return (
              <section key={group.key} className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleDay(group.key)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-md bg-green-50 border border-green-100 text-green-800 flex items-center justify-center">
                      {expanded ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                    </span>
                    <span className="text-left">
                      <span className="block text-sm font-bold text-gray-900">{group.title}</span>
                      <span className="block text-xs text-gray-500">
                        {group.items.length} screenshot{group.items.length === 1 ? '' : 's'}
                      </span>
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (() => {
                  const currentGroupPage = pageMap[group.key] || 1;
                  const totalGroupItems = group.items.length;
                  const totalGroupPages = Math.max(1, Math.ceil(totalGroupItems / pageSize));
                  const safeGroupPage = Math.min(Math.max(1, currentGroupPage), totalGroupPages);
                  const startIndex = (safeGroupPage - 1) * pageSize;
                  const endIndex = Math.min(startIndex + pageSize, totalGroupItems);
                  const paginatedGroupItems = group.items.slice(startIndex, endIndex);

                  return (
                    <div className="border-t border-gray-100 p-3 space-y-3">
                      <div className="max-h-[420px] overflow-y-auto">
                        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
                          {paginatedGroupItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => void openPreview(item)}
                              title={`Click to view ${item.file_name} (${new Date(item.captured_at).toLocaleTimeString()})`}
                              className="text-left border border-gray-200 rounded-md overflow-hidden bg-white hover:border-green-600 hover:shadow-md transition-all group"
                            >
                              <div className="relative h-14 bg-gray-100 flex items-center justify-center overflow-hidden">
                                <GalleryThumbnail
                                  item={item}
                                  source={thumbnails[item.id]}
                                  onRequest={requestThumbnail}
                                />
                                <span
                                  className={`absolute top-1 right-1 p-0.5 rounded-full border shadow-sm ${
                                    item.status === 'COMPLETED'
                                      ? 'bg-green-600 border-green-700 text-white'
                                      : item.status === 'FAILED'
                                        ? 'bg-red-600 border-red-700 text-white'
                                        : 'bg-amber-500 border-amber-600 text-white'
                                  }`}
                                  title={item.status}
                                >
                                  {item.status === 'COMPLETED' ? (
                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                  ) : item.status === 'FAILED' ? (
                                    <X className="h-2.5 w-2.5 stroke-[3]" />
                                  ) : (
                                    <Clock className="h-2.5 w-2.5 stroke-[2.5]" />
                                  )}
                                </span>
                                <span className="absolute inset-0 bg-gray-950/0 group-hover:bg-gray-950/20 flex items-center justify-center transition-colors">
                                  <Maximize2 className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                              </div>
                              <div className="p-1 px-1.5 space-y-0.5">
                                <div className="flex items-center justify-between text-[9px] font-bold text-gray-800">
                                  <span className="truncate">
                                    {new Date(item.captured_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[8px] font-mono text-gray-400">
                                  <span className="truncate max-w-[45px]" title={item.file_name}>{item.file_name}</span>
                                  <span className="font-sans shrink-0">{(item.file_size / 1024).toFixed(0)}KB</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {totalGroupItems > 0 && (
                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs px-1">
                          <div className="text-gray-500 font-medium">
                            Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to <span className="font-bold text-gray-800">{endIndex}</span> of <span className="font-bold text-gray-800">{totalGroupItems}</span> screenshots
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              disabled={safeGroupPage <= 1}
                              onClick={() => setPageMap((prev) => ({ ...prev, [group.key]: safeGroupPage - 1 }))}
                              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Previous</span>
                            </button>

                            <div className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-50 rounded-md border border-gray-200">
                              Page {safeGroupPage} of {totalGroupPages}
                            </div>

                            <button
                              disabled={safeGroupPage >= totalGroupPages}
                              onClick={() => setPageMap((prev) => ({ ...prev, [group.key]: safeGroupPage + 1 }))}
                              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center text-gray-400 shadow-sm">
          <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No screenshot folders match this filter.</p>
        </div>
      )}

      {selected &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-sm p-4 flex items-center justify-center"
            onMouseDown={closePreview}
            role="dialog"
            aria-modal="true"
            aria-label="Screenshot preview"
          >
            <div
              className="w-[96vw] h-[94vh] bg-gray-900 border border-gray-700 rounded-md overflow-hidden shadow-2xl flex flex-col"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="h-14 px-4 border-b border-gray-700 flex items-center justify-between shrink-0">
                <div className="min-w-0">
                  <div className="text-sm text-white font-mono font-semibold truncate">{selected.file_name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-3 mt-0.5">
                    <span>{new Date(selected.captured_at).toLocaleString()}</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {(selected.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="h-9 w-9 rounded-md border border-gray-600 bg-gray-800 text-white hover:bg-red-600 hover:border-red-500 flex items-center justify-center"
                  aria-label="Close screenshot preview from header"
                  title="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 p-4 flex items-center justify-center bg-black">
                {previewLoading ? (
                  <div className="text-gray-300 text-sm flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading full-resolution screenshot…
                  </div>
                ) : fullPreview ? (
                  <img
                    src={fullPreview}
                    alt={selected.file_name}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                  />
                ) : (
                  <div className="text-gray-400 text-sm">The full-resolution image is unavailable.</div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
