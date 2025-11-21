/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { bidService } from "../api/services/bid.service";

const PlaceBid = ({ order, onClose }) => {
  const orderId = order?._id;
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    zipCode: '',
    coordinates: { lat: null, lng: null },
  });

  const handleChange = (field, value) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) {
      setError("Enter a valid bid amount.");
      return;
    }

    setLoading(true);
    try {
      await bidService.placeBid(order._id, { bidAmount: Number(bidAmount), deliveryAddress });
      alert("Bid placed successfully!");
      onClose(); // close the modal
    } catch (err) {
      console.error("Error placing bid:", err);
      setError(err?.response?.data?.message || "Failed to place bid. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 text-gray-500 hover:text-red-500 text-lg font-bold"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-gray-800">{order.restaurant || "Unknown Restaurant"}</h2>
        <p className="text-sm text-gray-500 mb-1">Order #{order.orderNumber}</p>
        <p className="text-lg font-semibold text-emerald-600 mb-4">Total: ${order.total.toFixed(2)}</p>

        {/* Items */}
        <h3 className="text-lg font-semibold mb-2">Items:</h3>
        <ul className="list-disc list-inside mb-4 max-h-40 overflow-y-auto">
          {order.items.map((item) => (
            <li key={item._id} className="flex justify-between text-gray-700 mb-1">
              <span className="font-semibold text-gray-800">• {item.name}</span>
              <span className="text-gray-500">x {item.quantity}</span>
            </li>
          ))}
        </ul>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        {/* Bid Input */}
        <div className="mb-4">
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter your bid"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        {/* Delivery Address */}
        <h3 className="text-lg font-semibold mb-2">Delivery Address</h3>
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Street"
            value={deliveryAddress.street}
            onChange={(e) => handleChange('street', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          <input
            type="text"
            placeholder="City"
            value={deliveryAddress.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          <input
            type="text"
            placeholder="ZIP Code"
            value={deliveryAddress.zipCode}
            onChange={(e) => handleChange('zipCode', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handlePlaceBid}
          disabled={loading}
          className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition"
        >
          {loading ? "Placing Bid..." : "Place Bid"}
        </button>
      </div>
    </div>
  );
};

export default PlaceBid;
