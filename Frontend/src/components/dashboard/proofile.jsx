import { useState } from 'react';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import styled from 'styled-components';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';


const AppContainer = styled.div`
  height: 100vh;
  background-color: #f3f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Header = styled.header`
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 3rem;
  height: 3rem;
  background-color: #4299e1;
  color: #fff;
  border-radius: 50%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2b6cb0;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 80%;
  max-width: 20rem;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #a0aec0;
  transition: color 0.3s ease;

  &:hover {
    color: #4a5568;
  }
`;

const proofile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchProfile();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove auth token from local storage
    navigate('/login'); // Redirect to login page
  };

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

  return (
    <AppContainer>
      <Header>
        <Button onClick={handleOpenModal} title="Open Profile">
          <FaUserCircle size={20} />
        </Button>
        <Button onClick={handleLogout} title="Logout">
          <FaSignOutAlt size={20} />
        </Button>
      </Header>

      {isModalOpen && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
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
          </ModalContent>
        </Modal>
      )}
    </AppContainer>
  );
};

export default proofile;