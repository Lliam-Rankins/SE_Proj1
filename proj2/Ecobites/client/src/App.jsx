import React from 'react'
import './index.css'
import SiteHeader from './site/Header';
import SiteFooter from './site/Footer';
import Index from './pages/Index'
import Profile from './pages/Profile'
import Login from './pages/login'
import OrderDetails from './pages/OrderDetails'
import Drivers from './drivers/Drivers'
import { Routes, Route } from 'react-router-dom';
import Customer from './customers/Customer';
import Checkout from './customers/Checkout';
import OrderStatus from './customers/OrderStatus';
import OrderDetail from './customers/OrderDetail';
import CancelledOrders from './customers/CancelledOrders';
import MyBids from './customers/MyBids';
import Restaurant from './restaurants/Restaurants';
import RestaurantReviews from './restaurants/RestaurantReviews';
import MenuItems from './restaurants/MenuItems';
import CustomerOrders from './restaurants/CustomerOrders';
import About from './pages/About';
import Impact from './pages/Impact';
import { RestaurantProvider } from './context/RestaurantContext';
import { CartProvider } from './context/CartContext';
import {ProtectedRoute} from './routes/ProtectedRoute';
import { RoleBasedRoute } from './routes/RoleBasedRoute';
import { ToastContainer  } from "react-toastify";


function App() {
  return (
    <RestaurantProvider>
      <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
          <main className="flex-1">
        <Routes>
      {/* Public */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/about" element={<About />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />

        {/* Customer Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['customer']} />}>
          <Route path="/customer" element={<Customer />} />
          <Route path="/customer/checkout" element={<Checkout />} />
          <Route path="/customer/orders" element={<OrderStatus />} />
          <Route path="/customer/orders/:orderId" element={<OrderDetail />} />
          <Route path="/customer/cancelled-orders" element={<CancelledOrders />} />
          <Route path="/customer/my-bids" element={<MyBids />} />
          <Route path="/customer/restaurant-reviews" element={<RestaurantReviews />} />
          <Route path="/customer/impact" element={<Impact />} />
        </Route>

        {/* Restaurant Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['restaurant']} />}>
          <Route path="/restaurants" element={<Restaurant />} />
          <Route path="/restaurants/menu" element={<MenuItems />} />
          <Route path="/restaurants/orders" element={<CustomerOrders />} />
        </Route>

        {/* Driver Routes */}
        <Route element={<RoleBasedRoute allowedRoles={['driver']} />}>
          <Route path="/driver" element={<Drivers />} />
        </Route>
      </Route>
    </Routes>
             </main>
             <SiteFooter />
           </div>
           <ToastContainer  />
           </CartProvider>
           </RestaurantProvider>
  );
}

export default App;

