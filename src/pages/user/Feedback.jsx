import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, FileUp, X, CheckCircle, RefreshCcw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import BulkImportModal from '../../components/BulkImportModal';
import { fetchFeedbackApi, createFeedbackApi, updateFeedbackStatusApi } from '../../utils/feedbackApi';
import { fetchUsersApi } from '../../utils/userApi';
import { uploadFileApi } from '../../utils/uploadApi';
import { findValue } from '../../utils/importHelpers';

const FEEDBACK_IMPORT_COLUMNS = ['Name', 'Email', 'Mobile No', 'Problem', 'Description', 'Suggestion'];

const Feedback = () => {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : {};

  const [tableLoading, setTableLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user.Name || '',
    email: user.Email || '',
    mobileNo: user['Mobile No.'] || user.Phone || '',
    problem: '',
    description: '',
    suggestion: '',
    screenshot: null
  });

  const problemOptions = [
    'Punch not registering',
    'Wrong punch timing',
    'Log in',
    'Attendance not synced',
    'Other'
  ];

  const fetchEmployees = async () => {
    const result = await fetchUsersApi();
    if (result.success) {
      setEmployees(result.data.filter(emp => emp.name));
    }
  };

  const fetchFeedbackData = async () => {
    setTableLoading(true);
    try {
      const result = await fetchFeedbackApi();
      if (!result.success) {
        toast.error('Could not load feedback history');
        setFeedbackData([]);
        return;
      }

      let finalData = result.data;
      if (user.Admin?.toLowerCase() !== 'yes') {
        finalData = finalData.filter(item =>
          item.name && item.name.toLowerCase() === (user.Name || '').toLowerCase()
        );
      }
      setFeedbackData(finalData.reverse());
    } finally {
      setTableLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState('pending');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchFeedbackData();
    if (user.Admin?.toLowerCase() === 'yes') {
      fetchEmployees();
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If Admin selects a name from dropdown, auto-fill related info
    if (name === 'name' && user.Admin?.toLowerCase() === 'yes') {
      const selectedEmp = employees.find(emp => emp.name === value);
      if (selectedEmp) {
        setFormData(prev => ({
          ...prev,
          name: value,
          email: selectedEmp.email || prev.email,
          mobileNo: selectedEmp.mobile || prev.mobileNo
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setFormData(prev => ({ ...prev, screenshot: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.problem || !formData.description) {
      toast.error('Please fill in all required fields (*)');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Submitting feedback...');

    try {
      let screenshotUrl = "";

      if (formData.screenshot) {
        toast.loading('Uploading screenshot...', { id: loadingToast });
        try {
          screenshotUrl = await uploadFileApi(formData.screenshot, 'feedback');
        } catch (uploadError) {
          toast.error("Screenshot upload failed, submitting without image.");
        }
      }

      toast.loading('Saving details...', { id: loadingToast });

      await createFeedbackApi({ ...formData, screenshotUrl });

      toast.success('Feedback submitted successfully!', { id: loadingToast });
      setShowForm(false);
      setFormData({
        name: user.Name || '',
        email: user.Email || '',
        mobileNo: user['Mobile No.'] || user.Phone || '',
        problem: '',
        description: '',
        suggestion: '',
        screenshot: null
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchFeedbackData();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Error submitting feedback', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    if (!approvalStatus || !selectedFeedback) {
      toast.error('Missing approval data');
      return;
    }
    setApproving(true);
    const loadingToast = toast.loading(`Submitting ${approvalStatus}...`);

    try {
      await updateFeedbackStatusApi(selectedFeedback.id, approvalStatus);
      toast.success(`Feedback ${approvalStatus} successfully!`, { id: loadingToast });
      setShowApprovalModal(false);
      setApprovalStatus('');
      setSelectedFeedback(null);
      fetchFeedbackData();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Error updating status', { id: loadingToast });
    } finally {
      setApproving(false);
    }
  };

  const processFeedbackImportRow = async (row) => {
    const name = findValue(row, ['Name']);
    const problem = findValue(row, ['Problem']);
    const description = findValue(row, ['Description']);

    if (!name || !problem || !description) {
      throw new Error('Missing required fields');
    }

    const email = findValue(row, ['Email']) || '';
    const mobileNo = findValue(row, ['Mobile No', 'Mobile', 'Phone']) || '';
    const suggestion = findValue(row, ['Suggestion']) || '';

    await createFeedbackApi({
      name: String(name),
      email: String(email),
      mobileNo: String(mobileNo),
      problem: String(problem),
      description: String(description),
      suggestion: String(suggestion),
      screenshotUrl: '',
    });
  };

  const filteredData = feedbackData.filter(item => {
    if (activeTab === 'pending') return item.isPending;
    if (activeTab === 'history') return item.isHistory;
    return true;
  });

  return (
    <div className="space-y-6 page-content p-4 md:p-6 pb-24 md:pb-12 h-full">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <MessageSquare className="text-indigo-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Feedback / Helpdesk</h1>
            <p className="text-sm text-gray-500">Report an issue or provide suggestions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchFeedbackData()}
            className="flex items-center justify-center p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            title="Refresh"
          >
            <RefreshCcw size={20} className={tableLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Bulk Import</span>
          </button>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              <span>Submit Feedback</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Submission Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">New Feedback</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  {user.Admin?.toLowerCase() === 'yes' ? (
                    <select
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp, i) => (
                        <option key={i} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="name"
                      required
                      readOnly
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Your Name"
                    />
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Mobile No */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile No
                  </label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="10-digit mobile number"
                  />
                </div>

                {/* Problem Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problem <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="problem"
                    required
                    value={formData.problem}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Select an issue</option>
                    {problemOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe your issue in detail..."
                />
              </div>

              {/* Suggestions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Any suggestions to improve the system?
                </label>
                <textarea
                  name="suggestion"
                  rows={2}
                  value={formData.suggestion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="We value your input..."
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Screenshot (Max 10 MB)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 transition-colors"
                  >
                    <FileUp size={16} />
                    <span>{formData.screenshot ? 'Change File' : 'Add File'}</span>
                  </button>
                  {formData.screenshot && (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <CheckCircle size={14} />
                      <span className="truncate max-w-[150px]">{formData.screenshot.name}</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50`}
                >
                  {submitting ? <RefreshCcw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mt-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-4 font-medium text-sm transition-colors relative ${activeTab === 'pending'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Pending Feedbacks
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-4 font-medium text-sm transition-colors relative ${activeTab === 'history'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          History
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {activeTab === 'pending' ? 'Pending Feedback Requests' : 'Feedback History'}
          </h2>
        </div>

        {tableLoading ? (
          <div className="p-8">
            <LoadingSpinner message="Loading feedbacks..." />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No feedback found</h3>
            <p className="text-gray-500">
              There are no {activeTab} feedback records yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {user.Admin?.toLowerCase() === 'yes' && activeTab === 'pending' && (
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Action</th>
                  )}
                  {activeTab === 'history' && (
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Status</th>
                  )}
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  {user.Admin?.toLowerCase() === 'yes' && (
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  )}
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Problem</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Attachment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((item, index) => (
                  <tr key={item.id ?? index} className="hover:bg-gray-50 transition-colors">
                    {user.Admin?.toLowerCase() === 'yes' && activeTab === 'pending' && (
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => { setSelectedFeedback(item); setShowApprovalModal(true); }}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 hover:text-indigo-800 transition-colors font-medium text-xs"
                        >
                          Action
                        </button>
                      </td>
                    )}
                    {activeTab === 'history' && (
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.status.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.status}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {item.timestamp ? item.timestamp.split('T')[0] : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {item.serialNo}
                    </td>
                    {user.Admin?.toLowerCase() === 'yes' && (
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.name}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100 whitespace-nowrap">
                        {item.problem}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-indigo-600 whitespace-nowrap">
                      {item.screenshot ? (
                        <a
                          href={item.screenshot}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          <FileUp size={14} /> View
                        </a>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Review Feedback</h2>
              <button
                onClick={() => { setShowApprovalModal(false); setApprovalStatus(''); }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleApprovalSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600 min-w-[80px]">ID:</span>
                  <p className="text-gray-900">{selectedFeedback.serialNo}</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600 min-w-[80px]">Name:</span>
                  <p className="text-gray-900">{selectedFeedback.name}</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600 min-w-[80px]">Problem:</span>
                  <p className="text-gray-900">{selectedFeedback.problem}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-600">Description:</span>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">{selectedFeedback.description}</p>
                </div>
                {selectedFeedback.suggestion && (
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-600">Suggestion:</span>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">{selectedFeedback.suggestion}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">Select Status</option>
                  <option value="Approved">Approved</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowApprovalModal(false); setApprovalStatus(''); }}
                  className="px-5 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                  disabled={approving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approving}
                  className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {approving ? <RefreshCcw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {approving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Bulk Import Feedback"
        columns={FEEDBACK_IMPORT_COLUMNS}
        processRow={processFeedbackImportRow}
        onImported={fetchFeedbackData}
      />
    </div>
  );
};

export default Feedback;
