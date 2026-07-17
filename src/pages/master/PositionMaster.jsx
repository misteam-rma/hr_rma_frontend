import React, { useEffect, useState } from 'react';
import { Plus, X, Search, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  fetchPositionsApi,
  createPositionApi,
  updatePositionApi,
  deletePositionApi,
} from '../../utils/positionMasterApi';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const PositionMaster = () => {
  const [positions, setPositions] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [positionName, setPositionName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPositions = async () => {
    setTableLoading(true);
    const result = await fetchPositionsApi();
    if (result.success) {
      setPositions(result.data);
    } else {
      toast.error('Failed to load positions: ' + result.error);
    }
    setTableLoading(false);
  };

  useEffect(() => {
    loadPositions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const openCreateModal = () => {
    setEditingId(null);
    setPositionName('');
    setShowModal(true);
  };

  const openEditModal = (position) => {
    setEditingId(position.id);
    setPositionName(position.positionName);
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setPositionName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!positionName.trim()) {
      toast.error('Please enter a position name');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updatePositionApi(editingId, positionName.trim());
        toast.success('Position updated successfully!');
      } else {
        await createPositionApi(positionName.trim());
        toast.success('Position added successfully!');
      }
      handleCancel();
      await loadPositions();
    } catch (error) {
      console.error('Position save error:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (position) => {
    if (!window.confirm(`Delete position "${position.positionName}"?`)) return;

    try {
      await deletePositionApi(position.id);
      toast.success('Position deleted successfully!');
      await loadPositions();
    } catch (error) {
      console.error('Position delete error:', error);
      toast.error(error.message || 'Failed to delete position');
    }
  };

  const filteredData = positions.filter((item) =>
    searchTerm ? item.positionName.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedData = filteredData.slice(pageStart, pageStart + pageSize);
  const rangeStart = filteredData.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredData.length);

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Position Master</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-xs sm:text-sm bg-white"
          />
        </div>

        <div className="flex items-center gap-2 justify-end sm:ml-auto">
          <button
            onClick={loadPositions}
            className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-all duration-200 shrink-0"
            title="Refresh"
            disabled={tableLoading}
          >
            <RefreshCcw size={16} className={tableLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-3.5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shrink-0"
            title="Add Position"
          >
            <Plus size={16} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Add Position</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                {editingId ? 'Edit Position' : 'Add New Position'}
              </h3>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position Name *</label>
                <input
                  type="text"
                  value={positionName}
                  onChange={(e) => setPositionName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter position name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto scrollbar-hide">
          <div className="max-h-[calc(105vh-330px)] min-h-[480px] overflow-y-auto scrollbar-hide">
            <table className="min-w-full">
              <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Serial No</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Position Name</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tableLoading ? (
                  <tr>
                    <td colSpan="3" className="px-6 border-b-none py-1">
                      <LoadingSpinner message="Loading..." minHeight="450px" />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-24 text-center">
                      <p className="text-gray-500 text-lg">No position data found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">{pageStart + index + 1}</td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-900 whitespace-nowrap">{item.positionName}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/60">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>
                Showing <span className="font-semibold text-gray-700">{rangeStart}–{rangeEnd}</span> of{' '}
                <span className="font-semibold text-gray-700">{filteredData.length}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-gray-600 min-w-[64px] text-center">{safePage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col h-[calc(100vh-220px)]">
          <div className="flex-1 p-2 space-y-3 overflow-y-auto scrollbar-hide">
            {tableLoading ? (
              <LoadingSpinner message="Retrieving positions..." minHeight="250px" />
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="p-4 bg-gray-100 rounded-full mb-3">
                  <Search size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-bold text-sm tracking-tight text-center px-6 uppercase">No matching positions found</p>
              </div>
            ) : (
              paginatedData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center justify-between gap-4 group hover:border-indigo-200 transition-all duration-300"
                >
                  <div className="text-sm font-black text-gray-800 leading-tight truncate uppercase tracking-tight">{item.positionName}</div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-90 transition-transform"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg active:scale-90 transition-transform"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile pagination footer */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-200 bg-white text-xs text-gray-600">
            <span>{rangeStart}–{rangeEnd} of {filteredData.length}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 border border-gray-300 rounded-md text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span>{safePage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 border border-gray-300 rounded-md text-gray-600 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionMaster;
