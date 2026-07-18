import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModalForm from '../../components/ModalForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import DataTable from '../../components/DataTable';
import {
  fetchSocialSitesApi,
  createSocialSiteApi,
  updateSocialSiteApi,
  deleteSocialSiteApi,
} from '../../utils/socialSiteMasterApi';

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];
const inputClass = 'w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs';
const labelClass = 'block text-xs font-semibold text-gray-700 mb-1';

const SocialSiteMaster = () => {
  const [socialSites, setSocialSites] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [siteName, setSiteName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadSocialSites = async () => {
    setTableLoading(true);
    const result = await fetchSocialSitesApi();
    if (result.success) {
      setSocialSites(result.data);
    } else {
      toast.error('Failed to load social sites: ' + result.error);
    }
    setTableLoading(false);
  };

  useEffect(() => {
    loadSocialSites();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const openCreateModal = () => {
    setEditingId(null);
    setSiteName('');
    setShowModal(true);
  };

  const openEditModal = (socialSite) => {
    setEditingId(socialSite.id);
    setSiteName(socialSite.siteName);
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setSiteName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!siteName.trim()) {
      toast.error('Please enter a site name');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateSocialSiteApi(editingId, siteName.trim());
        toast.success('Social site updated successfully!');
      } else {
        await createSocialSiteApi(siteName.trim());
        toast.success('Social site added successfully!');
      }
      handleCancel();
      await loadSocialSites();
    } catch (error) {
      console.error('Social site save error:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSocialSiteApi(deleteTarget.id);
      toast.success('Social site deleted successfully!');
      await loadSocialSites();
    } catch (error) {
      console.error('Social site delete error:', error);
      toast.error(error.message || 'Failed to delete social site');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredData = socialSites.filter((item) =>
    searchTerm ? item.siteName.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedData = filteredData.slice(pageStart, pageStart + pageSize);

  const headers = ['Serial No', 'Site Name', { label: 'Actions', className: 'w-28' }];

  const renderRow = (item, index) => (
    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 text-center">{pageStart + index + 1}</td>
      <td className="px-4 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">{item.siteName}</td>
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
    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center justify-between gap-4 group hover:border-blue-200 transition-all duration-300">
      <div className="text-sm font-black text-gray-800 leading-tight truncate uppercase tracking-tight">{item.siteName}</div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => openEditModal(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-90 transition-transform" title="Edit">
          <Pencil size={14} />
        </button>
        <button onClick={() => setDeleteTarget(item)} className="p-2 bg-red-50 text-red-600 rounded-lg active:scale-90 transition-transform" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Social Site Master</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search social sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-xs sm:text-sm bg-white"
          />
        </div>

        <div className="flex items-center gap-2 justify-end sm:ml-auto">
          <button onClick={loadSocialSites} className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-all duration-200 shrink-0" title="Refresh" disabled={tableLoading}>
            <RefreshCcw size={16} className={tableLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreateModal} className="inline-flex items-center justify-center px-3.5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shrink-0" title="Add Social Site">
            <Plus size={16} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Add Social Site</span>
          </button>
        </div>
      </div>

      <ModalForm
        isOpen={showModal}
        onClose={handleCancel}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Social Site' : 'Add New Social Site'}
        submitText={submitting ? 'Saving...' : editingId ? 'Update' : 'Submit'}
        maxWidth="max-w-md"
      >
        <div>
          <label className={labelClass}>Site Name *</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className={inputClass}
            placeholder="Enter site name"
            required
          />
        </div>
      </ModalForm>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        type="danger"
        title="Delete Social Site"
        message={`Are you sure you want to delete "${deleteTarget?.siteName}"? This cannot be undone.`}
        confirmText="Delete"
      />

      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden h-[calc(100vh-260px)] min-h-[420px]">
        {tableLoading ? (
          <LoadingSpinner message="Loading social sites..." minHeight="420px" />
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

export default SocialSiteMaster;
