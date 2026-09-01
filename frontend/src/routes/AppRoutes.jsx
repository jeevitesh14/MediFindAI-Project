import { Routes, Route } from 'react-router-dom';

import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import ComingSoon from '../components/common/ComingSoon';
import { ROLES } from '../constants/roles';

import Landing from '../pages/public/Landing';
import About from '../pages/public/About';
import Features from '../pages/public/Features';
import Unauthorized from '../pages/public/Unauthorized';
import NotFound from '../pages/public/NotFound';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

import UserDashboard from '../pages/user/Dashboard';
import MedicineSearch from '../pages/user/MedicineSearch';
import NearbyPharmacies from '../pages/user/NearbyPharmacies';
import Reservations from '../pages/user/Reservations';
import Cart from '../pages/user/Cart';
import Checkout from '../pages/user/Checkout';
import UserOrders from '../pages/user/Orders';

import PharmacyDashboard from '../pages/pharmacy/Dashboard';
import PharmacyInventory from '../pages/pharmacy/Inventory';
import PharmacyReservations from '../pages/pharmacy/Reservations';
import PharmacyOrders from '../pages/pharmacy/Orders';
import PharmacyProfile from '../pages/pharmacy/Profile';

import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminPharmacies from '../pages/admin/Pharmacies';
import AdminMedicines from '../pages/admin/Medicines';
import AdminReservations from '../pages/admin/Reservations';
import AdminOrders from '../pages/admin/Orders';
import AdminAnalytics from '../pages/admin/Analytics';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<Landing />} />
        <Route path="/testimonials" element={<Landing />} />
        <Route path="/contact" element={<Landing />} />
        <Route path="/ai-assistant" element={<Landing />} />
        <Route path="/medicines" element={<MedicineSearch />} />
        <Route path="/pharmacies" element={<NearbyPharmacies />} />
        <Route path="/cart" element={<Cart />} />
      </Route>

      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Checkout (authenticated user) */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.USER, ROLES.ADMIN, ROLES.PHARMACY_OWNER]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/dashboard/checkout" element={<Checkout />} />
        </Route>
      </Route>

      {/* USER dashboard */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.USER]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/dashboard/search" element={<MedicineSearch />} />
          <Route path="/dashboard/pharmacies" element={<NearbyPharmacies />} />
          <Route path="/dashboard/reservations" element={<Reservations />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/dashboard/orders" element={<UserOrders />} />
          <Route path="/orders" element={<UserOrders />} />
          <Route path="/dashboard/favourites" element={<ComingSoon title="Favourite Pharmacies" />} />
          <Route path="/favourites" element={<ComingSoon title="Favourite Pharmacies" />} />
          <Route path="/dashboard/notifications" element={<Reservations />} />
          <Route path="/dashboard/profile" element={<ComingSoon title="Profile & Settings" />} />
        </Route>
      </Route>

      {/* PHARMACY_OWNER dashboard */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.PHARMACY_OWNER]} />}>
        <Route element={<DashboardLayout />}>
          {/* Main /pharmacy-owner routes */}
          <Route path="/pharmacy-owner/dashboard" element={<PharmacyDashboard />} />
          <Route path="/pharmacy-owner/inventory" element={<PharmacyInventory />} />
          <Route path="/pharmacy-owner/reservations" element={<PharmacyReservations />} />
          <Route path="/pharmacy-owner/orders" element={<PharmacyOrders />} />
          <Route path="/pharmacy-owner/profile" element={<PharmacyProfile />} />

          {/* Alias /pharmacy routes for backwards compatibility */}
          <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
          <Route path="/pharmacy/medicines" element={<PharmacyInventory />} />
          <Route path="/pharmacy/inventory" element={<PharmacyInventory />} />
          <Route path="/pharmacy/reservations" element={<PharmacyReservations />} />
          <Route path="/pharmacy/orders" element={<PharmacyOrders />} />
          <Route path="/pharmacy/profile" element={<PharmacyProfile />} />
        </Route>
      </Route>

      {/* ADMIN dashboard */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/pharmacies" element={<AdminPharmacies />} />
          <Route path="/admin/verifications" element={<AdminPharmacies />} />
          <Route path="/admin/medicines" element={<AdminMedicines />} />
          <Route path="/admin/reservations" element={<AdminReservations />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
