import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/dashboard/Dashboard';
import SupplierDash from './components/dashboard/SupplierDash';
// import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/vendor-dashboard" element={<Dashboard />} />
        <Route path="/supplier-dashboard" element={<SupplierDash />} />
      </Routes>
    </Router>
  );
}

export default App;
