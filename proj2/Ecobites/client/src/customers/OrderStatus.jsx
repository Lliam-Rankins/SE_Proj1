/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../api/services/order.service';
import { bidService } from '../api/services/bid.service';
import { useAuthContext } from '../context/AuthContext';
import { STATUS_COLORS, ORDER_STATUS } from '../utils/constants';
import { useCart } from '../context/useCart';

const OrderStatus = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  //const { addOrderToCart } = useCart();

  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modal state
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        if (authLoading) return; // wait for auth to resolve
        if (!user?._id) throw new Error('Not authenticated');
        setLoading(true);
        const data = await orderService.getByRole('customer', user._id);
        // Normalize data for UI
        const orders = (Array.isArray(data) ? data : [])
          .map(o => ({
            _id: o._id,
            orderNumber: o.orderNumber,
            date: o.createdAt || o.updatedAt,
            status: o.status,
            items: o.items || [],
            total: o.total || o.totalPrice || 0,
            restaurant: typeof o.restaurant === 'string' ? o.restaurant : (o.restaurant?.name || o.restaurantName || ''),
          }));
        setPastOrders(orders);
        setError(null);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading]);

  const formatCurrency = (num) => {
    return Number(num).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  };

  const getStatusColor = (status) => {
    const key = String(status || '').toUpperCase().replace(/\s+/g, '_');
    return STATUS_COLORS[key] || 'text-gray-600 bg-gray-100';
  };

  const getStatusLabel = (status) => {
    const key = String(status || '').toUpperCase().replace(/\s+/g, '_');
    return ORDER_STATUS[key] || status;
  };

  // open bids modal
  const openBidsModal = async (order) => {
    try {
      setSelectedOrder(order);
      setBidsLoading(true);
      
      const bidsData = await bidService.getBidsForOrder(order._id);
      setBids(Array.isArray(bidsData) ? bidsData: []);
      setShowBidsModal(true);
    } catch (error) {
      console.error('Failed to load bids:', error);
      setBids([]);
    } finally {
      setBidsLoading(false);
    }
  };

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  // handle accept order bid
  const handleAccept = async (bidId) => {
    try {
      const response = await bidService.acceptBid(bidId);
      const { order, bid } = response.data;
      if (!order || !bid) throw new Error("Missing order or bid");
      // Update local bids state instead of refetching
      setBids(prev =>
      prev.map(bid =>
        bid._id === bidId ? { ...bid, status: "ACCEPTED" } : bid
      )
    );

    const bidderId = bid.bidderId
    // Load bidder's cart from localStorage
    const storageKey = `ecoCart_${bidderId}`;
    const existingCart = JSON.parse(localStorage.getItem(storageKey)) || [];

    const newCartItem = {
      items: order.items,
      orderId: order._id,
      total: order.total,
      restaurant: order.restaurant || "Unknown"
    };

    localStorage.setItem(storageKey, JSON.stringify([...existingCart, newCartItem]));


    // add items to bidder's cart
    /**addToCart({
      name: order.itemName,
      price: bid.bidAmount,
      restaurant: order.restaurantName,
      quantity: order.quantity ?? 1
    }); */

     showMessage("You have accepted a bid. Congratulations on avoiding wasting food!");

    } catch (error) {
      console.error('Failed to accept bid:', error);
      showMessage("Failed to accept bid. Please try again.");

    }
  };

  // handle reject order bid
  const handleReject = async (bidId) => {
    try {
      await bidService.rejectBid(bidId);
      openBidsModal(selectedOrder);
    } catch (error) {
      console.error('Failed to reject bid:', error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 pt-24 flex items-center justify-center">
        <p className="text-gray-600">Loading your orders…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Order History</h1>
          <button
            onClick={() => navigate('/customer')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            ← Back to Restaurants
          </button>
        </div>
         {/* Popup message */}
          {message && (
            <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-9999">
              {message}
            </div>
          )}

        {/* Order History */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Orders</h2>
          {error && (
            <p className="text-red-600 mb-3">{error}</p>
          )}
          {!error && pastOrders.length === 0 ? (
            <p className="text-gray-500">No orders found.</p>
          ) : (
            <div className="space-y-4">
              {pastOrders.map((order) => (
                <div
                  key={order._id}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/customer/orders/${order._id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-800">Order #{order.orderNumber || order._id?.slice(-6)}</p>
                      <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString()} • {order.restaurant}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        {(order.items || []).map(item => `${(item.name || item.itemName || item.menuItem?.name || 'Item')} x ${item.quantity}`).join(', ')}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-600">{formatCurrency(order.total)}</p>
                  </div>

                  {/*show 'view bids' button only for cancelled orders*/}
                  {order.status === "CANCELLED" && (
                    <div className="mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openBidsModal(order);
                        }}
                        className={`cursor-pointer px-4 py-2 rounded-lg transition-colors ${
                          bids.some(bid => bid.status === "ACCEPTED" && bid.orderId === order._id)
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        View Bids
                      </button>
                      </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* bids modal */}
          {showBidsModal && selectedOrder && (
            <div 
              className="fixed inset-0 flex justify-center items-start pt-24 z-50"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
                <button
                  className="cursor-pointer absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowBidsModal(false)}
                >
                  ✕
                </button>
                <h2 className="text-2xl font-bold text-earthbrown mb-4">
                  Bids for Order #{selectedOrder.orderNumber}
                </h2>

                {bidsLoading ? (
                  <p>Loading bids...</p>
                ) : bids.length === 0? (
                  <p className="text-gray-600">No bids yet</p>
                ) : (
                     <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {bids.map(bid => (
                    <li key={bid._id} className="border border-gray-300 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p><strong>Bidder:</strong> {bid.bidderId?.name || "Unknown"}</p>
                        <p className="text-emerald-600"><strong>Bid Amount:</strong> ${bid.bidAmount.toFixed(2)}</p>
                        <p><strong>Status:</strong> {bid.status}</p>
                      </div>
                      {bid.status === "PENDING" && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleAccept(bid._id)}
                            className="cursor-pointer bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(bid._id)}
                            className="cursor-pointer bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                )}
                </div>
                </div>

          )}

        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
