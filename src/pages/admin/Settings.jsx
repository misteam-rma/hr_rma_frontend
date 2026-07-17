import React, { useEffect, useState } from 'react';
import { X, Search, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  fetchAllUsersApi,
  updateUserSettingsApi,
  deleteUserSettingsApi,
} from '../../utils/userSettingsApi';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const emptyForm = {
  name: '',
  email: '',
  phoneNumber: '',
  employeeType: '',
  department: '',
  role: '',
  status: '',
  password: '',
  pin: '',
};

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = async () => {
    setTableLoading(true);
    const result = await fetchAllUsersApi();
    if (result.success) {
      setUsers(result.data);
    } else {
      toast.error('Failed to load users: ' + result.error);
    }
    setTableLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      employeeType: user.employeeType,
      department: user.department,
      role: user.role,
      status: user.status,
      password: '',
      pin: '',
    });
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setSubmitting(true);
      await updateUserSettingsApi(editingUser.id, formData);
      toast.success('User updated successfully!');
      handleCancel();
      await loadUsers();
    } catch (error) {
      console.error('User save error:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;

    try {
      await deleteUserSettingsApi(user.id);
      toast.success('User deleted successfully!');
      await loadUsers();
    } catch (error) {
      console.error('User delete error:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const filteredData = users.filter((item) =>
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
  const rangeStart = filteredData.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredData.length);

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Settings — Users</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-xs sm:text-sm bg-white"
          />
        </div>

        <div className="flex items-center gap-2 justify-end sm:ml-auto">
          <button
            onClick={loadUsers}
            className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-all duration-200 shrink-0"
            title="Refresh"
            disabled={tableLoading}
          >
            <RefreshCcw size={16} className={tableLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-800">Edit User — {editingUser?.code}</h3>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                  <input
                    type="text"
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <input
                    type="text"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Reset credentials (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="text"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Leave blank to keep unchanged"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
                    <input
                      type="text"
                      name="pin"
                      value={formData.pin}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Leave blank to keep unchanged"
                    />
                  </div>
                </div>
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
                  {submitting ? 'Saving...' : 'Update'}
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
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Code</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Department</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Role</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tableLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 border-b-none py-1">
                      <LoadingSpinner message="Loading..." minHeight="450px" />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <p className="text-gray-500 text-lg">No users found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">{pageStart + index + 1}</td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-900 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-indigo-600 font-semibold">{item.code || '—'}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">{item.department || '—'}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                        {item.role ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${item.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.role === 'admin' && <ShieldCheck size={12} />}
                            {item.role}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">{item.status || '—'}</td>
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
              <LoadingSpinner message="Retrieving users..." minHeight="250px" />
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="p-4 bg-gray-100 rounded-full mb-3">
                  <Search size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-bold text-sm tracking-tight text-center px-6 uppercase">No matching users found</p>
              </div>
            ) : (
              paginatedData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 space-y-3 relative overflow-hidden group hover:border-indigo-200 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-gray-800 leading-tight truncate uppercase tracking-tight">{item.name}</div>
                      <div className="text-[10px] font-bold text-gray-500 mt-1">{item.code || 'No code'}</div>
                    </div>
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

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter block opacity-60">Department</span>
                      <div className="text-[10px] font-bold text-gray-700">{item.department || '—'}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter block opacity-60">Role</span>
                      <div className="text-[10px] font-bold text-gray-700">{item.role || '—'}</div>
                    </div>
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

export default Settings;
