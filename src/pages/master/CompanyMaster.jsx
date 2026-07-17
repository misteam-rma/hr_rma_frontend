import React, { useEffect, useState } from 'react';
import { Plus, X, Search, Pencil, Trash2, RefreshCcw, ChevronLeft, ChevronRight, Building2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  fetchCompaniesApi,
  createCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
} from '../../utils/companyMasterApi';
import { uploadFileApi } from '../../utils/uploadApi';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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

  const handleDelete = async (company) => {
    if (!window.confirm(`Delete company "${company.companyName}"?`)) return;

    try {
      await deleteCompanyApi(company.id);
      toast.success('Company deleted successfully!');
      await loadCompanies();
    } catch (error) {
      console.error('Company delete error:', error);
      toast.error(error.message || 'Failed to delete company');
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
  const rangeStart = filteredData.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredData.length);

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
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-xs sm:text-sm bg-white"
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
            className="inline-flex items-center justify-center px-3.5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shrink-0"
            title="Add Company"
          >
            <Plus size={16} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Add Company</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-800">
                {editingId ? 'Edit Company' : 'Add New Company'}
              </h3>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Code *</label>
                  <input
                    type="text"
                    name="companyCode"
                    value={formData.companyCode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. COMP-01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legal Business Name</label>
                  <input
                    type="text"
                    name="legalBusinessName"
                    value={formData.legalBusinessName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter legal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <input
                    type="text"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. LLC, Pvt Ltd"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Jewelry, Manufacturing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Incorporation</label>
                  <input
                    type="date"
                    name="dateOfIncorporation"
                    value={formData.dateOfIncorporation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    name="officialEmail"
                    value={formData.officialEmail}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Primary contact"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Contact</label>
                  <input
                    type="text"
                    name="alternateContact"
                    value={formData.alternateContact}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Alternate contact"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 cursor-pointer hover:border-indigo-400 transition-colors">
                  <UploadCloud size={22} className="text-gray-400" />
                  {formData.companyLogoUrl ? (
                    <span className="text-sm text-indigo-600 font-medium">Logo uploaded — click to replace</span>
                  ) : (
                    <>
                      <span className="text-sm text-indigo-600 font-medium">
                        {uploadingLogo ? 'Uploading...' : 'Click to upload'} <span className="text-gray-500 font-normal">or drag and drop</span>
                      </span>
                      <span className="text-xs text-gray-400">SVG, PNG, JPG or GIF (max. 2MB)</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of the company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head Office Address</label>
                <textarea
                  name="headOfficeAddress"
                  value={formData.headOfficeAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Offices</label>
                  <input
                    type="text"
                    name="branchOffices"
                    value={formData.branchOffices}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Number or details"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Postal code"
                  />
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
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Company'}
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
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Company Name</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Company Code</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Industry</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Contact Number</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">City</th>
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
                      <p className="text-gray-500 text-lg">No company data found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">{pageStart + index + 1}</td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {item.companyLogoUrl ? (
                            <img src={item.companyLogoUrl} alt="" className="w-7 h-7 rounded object-cover border border-gray-200" />
                          ) : (
                            <span className="w-7 h-7 rounded bg-indigo-50 text-indigo-500 flex items-center justify-center">
                              <Building2 size={14} />
                            </span>
                          )}
                          {item.companyName}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-indigo-600 font-semibold">{item.companyCode}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">{item.industry || '—'}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">{item.contactNumber}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">{item.city || '—'}</td>
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
              <LoadingSpinner message="Retrieving companies..." minHeight="250px" />
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="p-4 bg-gray-100 rounded-full mb-3">
                  <Search size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-bold text-sm tracking-tight text-center px-6 uppercase">No matching companies found</p>
              </div>
            ) : (
              paginatedData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 space-y-3 relative overflow-hidden group hover:border-indigo-200 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-gray-800 leading-tight truncate uppercase tracking-tight">{item.companyName}</div>
                      <div className="text-[10px] font-bold text-gray-500 mt-1">{item.companyCode}</div>
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
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter block opacity-60">Industry</span>
                      <div className="text-[10px] font-bold text-gray-700">{item.industry || '—'}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter block opacity-60">Contact</span>
                      <div className="text-[10px] font-bold text-gray-700">{item.contactNumber}</div>
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

export default CompanyMaster;
