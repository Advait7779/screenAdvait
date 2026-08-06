import React, { useState, useEffect, useRef } from 'react';
import { CloudUpload, RefreshCw, AlertTriangle, CheckCircle, Database, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

interface QueuePageProps {
  addToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const QueuePage: React.FC<QueuePageProps> = ({ addToast }) => {
  const [status, setStatus] = useState<any>({ pendingCount: 0, completedCount: 0, failedCount: 0, recentQueue: [] });
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async (isManual = false) => {
    if (window.electronAPI) {
      setLoading(true);
      try {
        const res = await window.electronAPI.getQueueStatus();
        setStatus(res);
        if (isManual === true) addToast?.('Upload queue refreshed', 'info');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
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

  const totalItems = status.recentQueue?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = status.recentQueue?.slice(startIndex, endIndex) || [];

  return (
    <div className="space-y-5 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Resilient Upload Queue</h2>
          <p className="text-xs text-gray-500 mt-0.5">SQLite buffer & Google Drive cloud sync status</p>
        </div>

        <button
          onClick={() => fetchStatus(true)}
          disabled={loading}
          className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3.5 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-green-800 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-md flex items-center space-x-4 shadow-sm">
          <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{status.pendingCount}</div>
            <div className="text-xs text-gray-500 font-medium">Pending Local Buffer</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-md flex items-center space-x-4 shadow-sm">
          <div className="p-2.5 rounded-md bg-green-50 border border-green-200 text-green-800">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{status.completedCount}</div>
            <div className="text-xs text-gray-500 font-medium">Successfully Uploaded</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-md flex items-center space-x-4 shadow-sm">
          <div className="p-2.5 rounded-md bg-red-50 border border-red-700 text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{status.failedCount}</div>
            <div className="text-xs text-gray-500 font-medium">Failed / Retrying</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Queue Processing Items</h3>
          
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
                        setCurrentPage(1);
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
        </div>

        <div className="divide-y divide-gray-100">
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item: any) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-gray-50 px-2 rounded-md transition-colors">
                <div className="font-mono text-gray-800 font-medium">{item.file_name}</div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">{new Date(item.captured_at).toLocaleTimeString()}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'UPLOADING'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400 text-xs">Queue is empty.</div>
          )}
        </div>

        {totalItems > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to <span className="font-bold text-gray-800">{endIndex}</span> of <span className="font-bold text-gray-800">{totalItems}</span> items
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-50 rounded-md border border-gray-200">
                Page {safePage} of {totalPages}
              </div>

              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
