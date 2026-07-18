import React, { useEffect, useState } from 'react';
import { Search, Pencil, Trash2, RefreshCcw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModalForm from '../../components/ModalForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import DataTable from '../../components/DataTable';
import {
  fetchAllUsersApi,
  updateUserSettingsApi,
  deleteUserSettingsApi,
} from '../../utils/userSettingsApi';

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];
const inputClass = 'w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs';
const labelClass = 'block text-xs font-semibold text-gray-700 mb-1';

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
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUserSettingsApi(deleteTarget.id);
      toast.success('User deleted successfully!');
      await loadUsers();
    } catch (error) {
      console.error('User delete error:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeleteTarget(null);
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

  const headers = ['Serial No', 'Name', 'Code', 'Department', 'Role', 'Status', { label: 'Actions', className: 'w-28' }];

  const renderRow = (item, index) => (
    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 text-center">{pageStart + index + 1}</td>
      <td className="px-4 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">{item.name}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-semibold text-center">{item.code || '—'}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{item.department || '—'}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 text-center">
        {item.role ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {item.role === 'admin' && <ShieldCheck size={12} />}
            {item.role}
          </span>
        ) : '—'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{item.status || '—'}</td>
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
    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 space-y-3 relative overflow-hidden group hover:border-blue-200 transition-all duration-300">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-gray-800 leading-tight truncate uppercase tracking-tight">{item.name}</div>
          <div className="text-[10px] font-bold text-gray-500 mt-1">{item.code || 'No code'}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => openEditModal(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-90 transition-transform" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => setDeleteTarget(item)} className="p-2 bg-red-50 text-red-600 rounded-lg active:scale-90 transition-transform" title="Delete">
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
  );

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Settings — Users</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-xs sm:text-sm bg-white"
          />
        </div>

        <div className="flex items-center gap-2 justify-end sm:ml-auto">
          <button onClick={loadUsers} className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-all duration-200 shrink-0" title="Refresh" disabled={tableLoading}>
            <RefreshCcw size={16} className={tableLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <ModalForm
        isOpen={showModal}
        onClose={handleCancel}
        onSubmit={handleSubmit}
        title={`Edit User — ${editingUser?.code || ''}`}
        submitText={submitting ? 'Saving...' : 'Update'}
        maxWidth="max-w-lg"
        maxHeight="80vh"
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClass} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Employee Type</label>
            <input type="text" name="employeeType" value={formData.employeeType} onChange={handleInputChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input type="text" name="department" value={formData.department} onChange={handleInputChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Role</label>
            <select name="role" value={formData.role} onChange={handleInputChange} className={inputClass}>
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <input type="text" name="status" value={formData.status} onChange={handleInputChange} className={inputClass} />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Reset credentials (optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>New Password</label>
              <input type="text" name="password" value={formData.password} onChange={handleInputChange} className={inputClass} placeholder="Leave blank to keep unchanged" />
            </div>
            <div>
              <label className={labelClass}>New PIN</label>
              <input type="text" name="pin" value={formData.pin} onChange={handleInputChange} className={inputClass} placeholder="Leave blank to keep unchanged" />
            </div>
          </div>
        </div>
      </ModalForm>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        type="danger"
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
      />

      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden h-[calc(100vh-260px)] min-h-[420px]">
        {tableLoading ? (
          <LoadingSpinner message="Loading users..." minHeight="420px" />
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

export default Settings;
