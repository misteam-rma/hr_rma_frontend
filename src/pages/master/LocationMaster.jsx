import React, { useEffect, useRef, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Download, Upload, RefreshCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModalForm from '../../components/ModalForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import DataTable from '../../components/DataTable';
import {
  fetchLocationsApi,
  createLocationApi,
  updateLocationApi,
  deleteLocationApi,
} from '../../utils/locationApi';

const IMPORT_COLUMNS = ['Name of the Company', 'Latitude', 'Longitude', 'Duration'];
const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];
const inputClass = 'w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs';
const labelClass = 'block text-xs font-semibold text-gray-700 mb-1';

const findValue = (row, keys) => {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const match = rowKeys.find((k) => k.trim().toLowerCase() === key.toLowerCase());
    if (match !== undefined && row[match] !== undefined && row[match] !== '') {
      return row[match];
    }
  }
  return undefined;
};

// Duration headers vary a lot between uploaded sheets (typos, units in the
// header, different casing) — fall back to any column starting with "durat"
// instead of requiring an exact "Duration" match.
const findDurationValue = (row) => {
  const exact = findValue(row, ['Duration']);
  if (exact !== undefined) return exact;

  const rowKeys = Object.keys(row);
  const fuzzyMatch = rowKeys.find((k) => k.trim().toLowerCase().startsWith('durat'));
  if (fuzzyMatch !== undefined && row[fuzzyMatch] !== undefined && row[fuzzyMatch] !== '') {
    return row[fuzzyMatch];
  }
  return undefined;
};

const emptyForm = {
  companyName: '',
  latitude: '',
  longitude: '',
  duration: '',
};

const LocationMaster = () => {
  const [locations, setLocations] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  const loadLocations = async () => {
    setTableLoading(true);
    const result = await fetchLocationsApi();
    if (result.success) {
      setLocations(result.data);
    } else {
      toast.error('Failed to load locations: ' + result.error);
    }
    setTableLoading(false);
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (location) => {
    setEditingId(location.id);
    setFormData({
      companyName: location.companyName,
      latitude: location.latitude,
      longitude: location.longitude,
      duration: location.duration,
    });
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName || formData.latitude === '' || formData.longitude === '') {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateLocationApi(editingId, formData);
        toast.success('Location updated successfully!');
      } else {
        await createLocationApi(formData);
        toast.success('Location added successfully!');
      }
      handleCancel();
      await loadLocations();
    } catch (error) {
      console.error('Location save error:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLocationApi(deleteTarget.id);
      toast.success('Location deleted successfully!');
      await loadLocations();
    } catch (error) {
      console.error('Location delete error:', error);
      toast.error(error.message || 'Failed to delete location');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredData = locations.filter((item) =>
    searchTerm
      ? Object.values(item).some((val) =>
          String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedData = filteredData.slice(pageStart, pageStart + pageSize);

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('No location data to export');
      return;
    }

    const rows = filteredData.map((item) => ({
      'Name of the Company': item.companyName,
      Latitude: item.latitude,
      Longitude: item.longitude,
      Duration: item.duration || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Location Master');
    XLSX.writeFile(workbook, `location_master_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setImporting(true);
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
        const companyName = findValue(row, ['Name of the Company', 'Company Name', 'Company']);
        const latitude = findValue(row, ['Latitude']);
        const longitude = findValue(row, ['Longitude']);
        const duration = findDurationValue(row);

        if (!companyName || latitude === undefined || longitude === undefined) {
          failCount += 1;
          continue;
        }

        try {
          await createLocationApi({
            companyName,
            latitude,
            longitude,
            duration: duration !== undefined ? String(duration) : '',
          });
          successCount += 1;
        } catch (err) {
          console.error('Row import error:', err);
          failCount += 1;
        }
      }

      await loadLocations();

      if (successCount > 0) {
        toast.success(`Imported ${successCount} location${successCount === 1 ? '' : 's'}`);
      }
      if (failCount > 0) {
        toast.error(`Skipped ${failCount} row${failCount === 1 ? '' : 's'} — check required columns: ${IMPORT_COLUMNS.join(', ')}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to read file. Please upload a valid Excel/CSV file.');
    } finally {
      setImporting(false);
    }
  };

  const headers = ['Serial No', 'Name of the Company', 'Latitude', 'Longitude', 'Duration', { label: 'Actions', className: 'w-28' }];

  const renderRow = (item, index) => (
    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 text-center">{pageStart + index + 1}</td>
      <td className="px-4 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">{item.companyName}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-semibold text-center">{item.latitude}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-semibold text-center">{item.longitude}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{item.duration || '—'}</td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <div className="flex gap-1 justify-center">
          <button onClick={() => openEditModal(item)} className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
            <Pencil size={15} />
          </button>
          <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderCard = (item) => (
    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3.5 space-y-3 relative group hover:border-blue-200 transition-all duration-300">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-gray-800 leading-snug break-words uppercase tracking-tight">{item.companyName}</div>
          <div className="text-[11px] font-semibold text-gray-400 mt-1">{item.duration ? `Duration: ${item.duration}` : 'No duration set'}</div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => openEditModal(item)} className="p-2.5 bg-blue-50 text-blue-600 rounded-lg active:scale-90 transition-transform" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => setDeleteTarget(item)} className="p-2.5 bg-red-50 text-red-600 rounded-lg active:scale-90 transition-transform" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 min-w-0">
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter block">Latitude</span>
          <div className="text-[11px] font-bold text-gray-700 truncate">{item.latitude}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 min-w-0">
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter block">Longitude</span>
          <div className="text-[11px] font-bold text-gray-700 truncate">{item.longitude}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Location Master</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-xs sm:text-sm bg-white"
          />
        </div>

        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 justify-end sm:ml-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImportFile}
          />

          <button onClick={loadLocations} className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-all duration-200 shrink-0" title="Refresh" disabled={tableLoading}>
            <RefreshCcw size={16} className={tableLoading ? 'animate-spin' : ''} />
          </button>

          <button onClick={handleImportClick} className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-all duration-200 shrink-0" title="Import from Excel/CSV" disabled={importing}>
            <Upload size={16} className={importing ? 'animate-pulse' : ''} />
          </button>

          <button onClick={handleExport} className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-all duration-200 shrink-0" title="Export to Excel">
            <Download size={16} />
          </button>

          <button onClick={openCreateModal} className="inline-flex items-center justify-center p-2 sm:px-3.5 sm:py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shrink-0" title="Add Location">
            <Plus size={16} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Add Location</span>
          </button>
        </div>
      </div>

      <ModalForm
        isOpen={showModal}
        onClose={handleCancel}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Location' : 'Add New Location'}
        submitText={submitting ? 'Saving...' : editingId ? 'Update' : 'Submit'}
        maxWidth="max-w-md"
      >
        <div>
          <label className={labelClass}>Name of the Company *</label>
          <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className={inputClass} placeholder="Enter company name" required />
        </div>

        <div>
          <label className={labelClass}>Latitude *</label>
          <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} className={inputClass} placeholder="Enter latitude" required />
        </div>

        <div>
          <label className={labelClass}>Longitude *</label>
          <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} className={inputClass} placeholder="Enter longitude" required />
        </div>

        <div>
          <label className={labelClass}>Duration</label>
          <input type="text" name="duration" value={formData.duration} onChange={handleInputChange} className={inputClass} placeholder="e.g. 30 mins" />
        </div>
      </ModalForm>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        type="danger"
        title="Delete Location"
        message={`Are you sure you want to delete "${deleteTarget?.companyName}"? This cannot be undone.`}
        confirmText="Delete"
      />

      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden h-[calc(100vh-260px)] min-h-[420px]">
        {tableLoading ? (
          <LoadingSpinner message="Loading locations..." minHeight="420px" />
        ) : (
          <DataTable
            headers={headers}
            data={paginatedData}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-full"
            currentPage={safePage}
            totalPages={totalPages}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setPageSize}
            totalResults={filteredData.length}
            itemsPerPageOptions={PAGE_SIZE_OPTIONS}
          />
        )}
      </div>
    </div>
  );
};

export default LocationMaster;
