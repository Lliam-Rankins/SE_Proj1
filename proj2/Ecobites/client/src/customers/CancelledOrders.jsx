/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { bidService } from "../api/services/bid.service";
//import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import PlaceBid from "./PlaceBid";

const CancelledOrders = () => {
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCancelledOrders = async () => {
      try {
        const response = await bidService.getCancelledOrders();
        setCancelledOrders(response?.data || []);
      } catch (error) {
        console.error("Error fetching cancelled orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCancelledOrders();
  }, []);

  // open place bid dialog box
  const openModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  if (loading) return "loading";

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-earthbrown mb-8">
        Cancelled Orders Available for Bidding
      </h1>

      {cancelledOrders.length === 0 ? (
        <p className="text-lg text-gray-600">No cancelled orders available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cancelledOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white border border-gray-300 p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-xl font-semibold text-earthbrown mb-2">
                Order #{order.orderNumber}
              </h2>

              <p className="text-gray-800 font-medium">
                Customer:{" "}
                <span className="text-black font-semibold">
                    {order.originalCustomer || "Unknown"}
                </span>
              </p>

              <p className="text-gray-800 font-medium">
                Restaurant:{" "}
                <span className="text-black font-semibold">
                  {order.restaurant || "Unknown"}
                </span>
              </p>

              <p className="text-gray-700 mt-1">
                Total:{" "}
                <span className="font-bold text-green-700">
                  ${order.total.toFixed(2)}
                </span>
              </p>

              <p className="text-gray-600 text-sm mt-1">
                Cancelled At:{" "}
                {new Date(order.updatedAt).toLocaleString()}
              </p>

              <h3 className="mt-4 font-semibold text-earthbrown">Items:</h3>
              <ul className="list-disc list-inside text-gray-700 text-sm mb-4">
                {order.items.map((item) => (
                  <li key={item._id}>
                    {item.name} x {item.quantity}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => openModal(order)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Place Bid
              </button>
            </div>
          ))}
        </div>
      )}

        {/* Place Bid Modal */}
        {showModal && selectedOrder && (
            <div className="fixed inset-0 flex justify-center items-center z-50"
                style={{
                    backgroundColor: "rgba(0,0,0,0.2)", // semi-transparent overlay
                    backdropFilter: "blur(1px)",        // blur the background
                }}>
                <PlaceBid
                    order={selectedOrder}
                    onClose={() => setShowModal(false)}
                />
            </div>
        )}
    </div>
  );
};

export default CancelledOrders;
