import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCcw, Building2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModalForm from '../../components/ModalForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import DataTable from '../../components/DataTable';
import DateInput from '../../components/DateInput';
import {
  fetchCompaniesApi,
  createCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
} from '../../utils/companyMasterApi';
import { uploadFileApi } from '../../utils/uploadApi';

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];

const inputClass = 'w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs';
const labelClass = 'block text-xs font-semibold text-gray-700 mb-1';

const emptyForm = {
  companyName: '',
  companyCode: '',
  legalBusinessName: '',
  businessType: '',
  industry: '',
  dateOfIncorporation: '',
  website: '',
  officialEmail: '',
  contactNumber: '',
  alternateContact: '',
  companyLogoUrl: '',
  companyDescription: '',
  headOfficeAddress: '',
  branchOffices: '',
  country: '',
  state: '',
  city: '',
  pincode: '',
};

const CompanyMaster = () => {
  const [companies, setCompanies] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCompanies = async () => {
    setTableLoading(true);
    const result = await fetchCompaniesApi();
    if (result.success) {
      setCompanies(result.data);
    } else {
      toast.error('Failed to load companies: ' + result.error);
    }
    setTableLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be 2MB or smaller');
      return;
    }

    try {
      setUploadingLogo(true);
      const fileUrl = await uploadFileApi(file, 'company_logo');
      setFormData((prev) => ({ ...prev, companyLogoUrl: fileUrl }));
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (company) => {
    setEditingId(company.id);
    setFormData({ ...emptyForm, ...company });
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName || !formData.companyCode || !formData.contactNumber) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateCompanyApi(editingId, formData);
        toast.success('Company updated successfully!');
      } else {
        await createCompanyApi(formData);
        toast.success('Company added successfully!');
      }
      handleCancel();
      await loadCompanies();
    } catch (error) {
      console.error('Company save error:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCompanyApi(deleteTarget.id);
      toast.success('Company deleted successfully!');
      await loadCompanies();
    } catch (error) {
      console.error('Company delete error:', error);
      toast.error(error.message || 'Failed to delete company');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredData = companies.filter((item) =>
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

  const headers = ['Serial No', 'Company Name', 'Company Code', 'Industry', 'Contact Number', 'City', { label: 'Actions', className: 'w-28' }];

  const renderRow = (item, index) => (
    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 text-center">{pageStart + index + 1}</td>
      <td className="px-4 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {item.companyLogoUrl ? (
            <img src={item.companyLogoUrl} alt="" className="w-7 h-7 rounded object-cover border border-gray-200" />
          ) : (
            <span className="w-7 h-7 rounded bg-blue-50 text-blue-500 flex items-center justify-center">
              <Building2 size={14} />
            </span>
          )}
          {item.companyName}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-semibold text-center">{item.companyCode}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{item.industry || '—'}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{item.contactNumber}</td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{item.city || '—'}</td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => openEditModal(item)}
            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderCard = (item) => (
    <div
      key={item.id}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 space-y-3 relative overflow-hidden group hover:border-blue-200 transition-all duration-300"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-gray-800 leading-tight truncate uppercase tracking-tight">{item.companyName}</div>
          <div className="text-[10px] font-bold text-gray-500 mt-1">{item.companyCode}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => openEditModal(item)}
            className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-90 transition-transform"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-2 bg-red-50 text-red-600 rounded-lg active:scale-90 transition-transform"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter block opacity-60">Industry</span>
          <div className="text-[10px] font-bold text-gray-700">{item.industry || '—'}</div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter block opacity-60">Contact</span>
          <div className="text-[10px] font-bold text-gray-700">{item.contactNumber}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 md:pb-4 mb-4">
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Company Master</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-xs sm:text-sm bg-white"
          />
        </div>

        <div className="flex items-center gap-2 justify-end sm:ml-auto">
          <button
            onClick={loadCompanies}
            className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-all duration-200 shrink-0"
            title="Refresh"
            disabled={tableLoading}
          >
            <RefreshCcw size={16} className={tableLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-3.5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shrink-0"
            title="Add Company"
          >
            <Plus size={16} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Add Company</span>
          </button>
        </div>
      </div>

      <ModalForm
        isOpen={showModal}
        onClose={handleCancel}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Company' : 'Add New Company'}
        submitText={submitting ? 'Saving...' : editingId ? 'Update' : 'Add Company'}
        maxWidth="max-w-2xl"
        maxHeight="80vh"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Company Name *</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className={inputClass} placeholder="Enter company name" required />
          </div>
          <div>
            <label className={labelClass}>Company Code *</label>
            <input type="text" name="companyCode" value={formData.companyCode} onChange={handleInputChange} className={inputClass} placeholder="e.g. COMP-01" required />
          </div>

          <div>
            <label className={labelClass}>Legal Business Name</label>
            <input type="text" name="legalBusinessName" value={formData.legalBusinessName} onChange={handleInputChange} className={inputClass} placeholder="Enter legal name" />
          </div>
          <div>
            <label className={labelClass}>Business Type</label>
            <input type="text" name="businessType" value={formData.businessType} onChange={handleInputChange} className={inputClass} placeholder="e.g. LLC, Pvt Ltd" />
          </div>

          <div>
            <label className={labelClass}>Industry</label>
            <input type="text" name="industry" value={formData.industry} onChange={handleInputChange} className={inputClass} placeholder="e.g. Jewelry, Manufacturing" />
          </div>
          <DateInput label="Date of Incorporation" name="dateOfIncorporation" value={formData.dateOfIncorporation} onChange={handleInputChange} />

          <div>
            <label className={labelClass}>Website</label>
            <input type="url" name="website" value={formData.website} onChange={handleInputChange} className={inputClass} placeholder="https://example.com" />
          </div>
          <div>
            <label className={labelClass}>Official Email</label>
            <input type="email" name="officialEmail" value={formData.officialEmail} onChange={handleInputChange} className={inputClass} placeholder="contact@company.com" />
          </div>

          <div>
            <label className={labelClass}>Contact Number *</label>
            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className={inputClass} placeholder="Primary contact" required />
          </div>
          <div>
            <label className={labelClass}>Alternate Contact</label>
            <input type="text" name="alternateContact" value={formData.alternateContact} onChange={handleInputChange} className={inputClass} placeholder="Alternate contact" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Company Logo</label>
          <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 cursor-pointer hover:border-blue-400 transition-colors">
            <UploadCloud size={20} className="text-gray-400" />
            {formData.companyLogoUrl ? (
              <span className="text-xs text-blue-600 font-medium">Logo uploaded — click to replace</span>
            ) : (
              <>
                <span className="text-xs text-blue-600 font-medium">
                  {uploadingLogo ? 'Uploading...' : 'Click to upload'} <span className="text-gray-500 font-normal">or drag and drop</span>
                </span>
                <span className="text-[10px] text-gray-400">SVG, PNG, JPG or GIF (max. 2MB)</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
          </label>
        </div>

        <div>
          <label className={labelClass}>Company Description</label>
          <textarea name="companyDescription" value={formData.companyDescription} onChange={handleInputChange} rows={2} className={inputClass} placeholder="Brief description of the company" />
        </div>

        <div>
          <label className={labelClass}>Head Office Address</label>
          <textarea name="headOfficeAddress" value={formData.headOfficeAddress} onChange={handleInputChange} rows={2} className={inputClass} placeholder="Full address" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Branch Offices</label>
            <input type="text" name="branchOffices" value={formData.branchOffices} onChange={handleInputChange} className={inputClass} placeholder="Number or details" />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input type="text" name="country" value={formData.country} onChange={handleInputChange} className={inputClass} placeholder="Country" />
          </div>

          <div>
            <label className={labelClass}>State</label>
            <input type="text" name="state" value={formData.state} onChange={handleInputChange} className={inputClass} placeholder="State" />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClass} placeholder="City" />
          </div>

          <div>
            <label className={labelClass}>Pincode</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className={inputClass} placeholder="Postal code" />
          </div>
        </div>
      </ModalForm>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        type="danger"
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteTarget?.companyName}"? This cannot be undone.`}
        confirmText="Delete"
      />

      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden h-[calc(100vh-260px)] min-h-[420px]">
        {tableLoading ? (
          <LoadingSpinner message="Loading companies..." minHeight="420px" />
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

export default CompanyMaster;
