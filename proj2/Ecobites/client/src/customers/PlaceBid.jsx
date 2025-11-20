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
    state: '',
    zip: '',
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
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <button
        onClick={onClose}
        className="mb-4 text-red-500 font-bold float-right"
      >
        X
      </button>

      <h2 className="text-xl font-semibold mb-2">{order.restaurant || "Unknown Restaurant"}</h2>
      <p>Order #{order.orderNumber}</p>
      <p>Total: ${order.total.toFixed(2)}</p>

      <h3 className="mt-3 font-semibold">Items:</h3>
      <ul className="list-disc list-inside mb-4">
        {order.items.map((item) => (
          <li key={item._id}>
            {item.name} x {item.quantity}
          </li>
        ))}
      </ul>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <input
        type="number"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        placeholder="Enter your bid"
        className="border p-2 rounded w-full mb-4"
      />
      <input
        type="text"
        placeholder="Street"
        value={deliveryAddress.street}
        onChange={(e) => handleChange('street', e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="City"
        value={deliveryAddress.city}
        onChange={(e) => handleChange('city', e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="State"
        value={deliveryAddress.state}
        onChange={(e) => handleChange('state', e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="ZIP Code"
        value={deliveryAddress.zip}
        onChange={(e) => handleChange('zip', e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        onClick={handlePlaceBid}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded w-full"
      >
        {loading ? "Placing Bid..." : "Place Bid"}
      </button>
    </div>
  );
};

export default PlaceBid;
