import { useState } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom'; // Use this if you are using react-router for navigation

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Assuming you're using react-router for page navigation

  // Fetch profile data
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  // Open modal and fetch profile
  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchProfile();
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove auth token from local storage
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className=" h-screen bg-gray-100">
      {/* Profile Icon and Logout Button on Top-Left */}
      <div className="absolute top-4 left-4 flex items-center space-x-4">
        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all"
          title="Open Profile"
        >
          <i className="fi fi-rr-user text-2xl"></i>
        </button>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all"
          title="Logout"
        >
          <i className="fi fi-rr-sign-out text-2xl"></i>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          {/* Modal Content */}
          <div className="relative p-6 bg-white rounded-lg shadow-lg w-80">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold text-gray-700">
              {profile ? profile.username : 'Loading...'}
            </h2>
            {loading && <p className="mt-2 text-sm text-gray-500">Loading...</p>}
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            {profile && (
              <div className="mt-4 space-y-2 text-left text-gray-600">
                <p>
                  <span className="font-medium">Email:</span> {profile.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {profile.phone_number}
                </p>
                {/* Add additional fields as needed */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;





//