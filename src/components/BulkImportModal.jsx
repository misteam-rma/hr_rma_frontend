import React, { useRef, useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Generic CSV/Excel bulk-import modal. Parsing and looping is handled here;
// callers just supply the required column names (shown as a note) and a
// `processRow(row)` callback that maps one parsed row to a create-API call
// and throws if the row is invalid/incomplete.
const BulkImportModal = ({ isOpen, onClose, title = 'Bulk Import', columns = [], processRow, onImported }) => {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rows.length === 0) {
        toast.error('The selected file has no rows');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const row of rows) {
        try {
          await processRow(row);
          successCount += 1;
        } catch (err) {
          console.error('Row import error:', err);
          failCount += 1;
        }
      }

      if (successCount > 0) {
        toast.success(`Imported ${successCount} record${successCount === 1 ? '' : 's'}`);
      }
      if (failCount > 0) {
        toast.error(`Skipped ${failCount} row${failCount === 1 ? '' : 's'} — check required columns`);
      }

      if (successCount > 0) {
        onImported?.();
        onClose();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to read file. Please upload a valid Excel/CSV file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" disabled={importing}>
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide mb-1">Columns in your file</p>
            <p className="text-xs text-indigo-900 leading-relaxed">{columns.join(', ')}</p>
          </div>
          <p className="text-xs text-gray-500">
            Upload a .csv or .xlsx file with a header row matching the column names above (order doesn't matter).
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <UploadCloud size={16} />
            {importing ? 'Importing...' : 'Choose File & Import'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
