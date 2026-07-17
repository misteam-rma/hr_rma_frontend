import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Camera,
  Edit3,
  Save,
  X,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchJoiningByIdApi, updateJoiningApi } from '../../utils/joiningApi';
import { fetchLeavesApi } from '../../utils/leaveManagementApi';
import { uploadFileApi } from '../../utils/uploadApi';

const MyProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaveData, setLeaveData] = useState([]);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      const imageUrl = await uploadFileApi(file, 'photo');
      const updated = await updateJoiningApi(profileData.id, { candidatePhoto: imageUrl });
      setProfileData(updated);
      setFormData(updated);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchLeaveData = async () => {
    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) return;

    const result = await fetchLeavesApi(employeeId);
    if (result.success) {
      setLeaveData(result.data);
    }
  };

  useEffect(() => {
    if (profileData) {
      fetchLeaveData();
    } else if (profileData === null && !loading) {
      navigate('/leave-request');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, loading, navigate]);

  const fetchJoiningData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No user data found in localStorage');
      }

      const currentUser = JSON.parse(userData);
      if (!currentUser.joiningId) {
        setProfileData(null);
        setFormData({});
        return;
      }

      const profile = await fetchJoiningByIdApi(currentUser.joiningId);
      setProfileData(profile);
      setFormData(profile);
    } catch (error) {
      console.error('Error fetching joining data:', error);
      toast.error(`Failed to load profile data: ${error.message}`);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoiningData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await updateJoiningApi(profileData.id, {
        mobileNo: formData.mobileNo,
        email: formData.email,
        familyMobileNo: formData.familyMobileNo,
        currentAddress: formData.currentAddress,
      });
      setProfileData(updated);
      setFormData(updated);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="page-content p-6">
        <LoadingSpinner message="Loading profile data..." minHeight="400px" />
      </div>
    );
  }

  if (!profileData) {
    return <div className="page-content p-6">No profile data available</div>;
  }

  return (
    <div className="space-y-6 page-content p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Edit3 size={16} className="mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save size={16} className="mr-2" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Picture & Basic Info */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="text-center">
            <div
              className="relative w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden cursor-pointer"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={handleProfilePictureClick}
            >
              {profileData.candidatePhoto ? (
                <img
                  src={profileData.candidatePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover profile-image-tag"
                  onError={(e) => {
                    e.target.style.display = "none";
                    const defaultAvatar = e.target.parentElement.querySelector('.default-avatar-container');
                    if (defaultAvatar) {
                      defaultAvatar.classList.remove('hidden');
                      defaultAvatar.classList.add('flex');
                    }
                  }}
                />
              ) : null}
              <div
                className={`default-avatar-container w-full h-full items-center justify-center ${profileData.candidatePhoto ? "hidden" : "flex"
                  }`}
              >
                <User size={48} className="text-indigo-400" />
              </div>

              {/* Hover overlay with camera icon */}
              <div
                className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                <Camera size={32} className="text-white" />
              </div>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <h2 className="text-xl font-bold text-gray-800">
              {profileData.nameAsPerAadhar}
            </h2>
            <p className="text-gray-600 font-bold">{profileData.designation}</p>
            <p className="text-sm text-gray-500 mt-1">Click on photo to update</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Personal Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
            {/* First Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Full Name
                </label>
                <p className="text-gray-800 font-medium">
                  {profileData.nameAsPerAadhar}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building size={16} className="inline mr-2" />
                  Joining ID
                </label>
                <p className="text-gray-800">{profileData.joiningId}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building size={16} className="inline mr-2" />
                  Department
                </label>
                <p className="text-gray-800">{profileData.department}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Date of Birth
                </label>
                <p className="text-gray-800">{profileData.dob}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <p className="text-gray-800">{profileData.gender}</p>
              </div>
            </div>

            {/* Second Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Joining Date
                </label>
                <p className="text-gray-800">{profileData.dateOfJoining}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="mobileNo"
                    value={formData.mobileNo || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.mobileNo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="familyMobileNo"
                    value={formData.familyMobileNo || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-gray-800">{profileData.familyMobileNo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Current Address - Full width below the two columns */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Current Address
            </label>
            {isEditing ? (
              <textarea
                name="currentAddress"
                value={formData.currentAddress || ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800 whitespace-pre-line">
                {profileData.currentAddress}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Bottom Section - Full Width */}
      <div className="w-full pb-12">
        {/* Leave History Card */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Leave History
          </h3>
          {leaveData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      From Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      To Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveData.map((leave, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {leave.leaveType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {leave.startDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {leave.endDate}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${leave.status.toLowerCase() === "approved"
                            ? "bg-green-100 text-green-800"
                            : leave.status.toLowerCase() === "reject"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {leave.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No leave records found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
