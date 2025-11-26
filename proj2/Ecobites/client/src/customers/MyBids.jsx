/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { bidService } from "../api/services/bid.service";
import { userService } from "../api/services/user.service";
import { toast } from "react-toastify";

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("Loading...");

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
        setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (expiresAt) => {
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "Expired";

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  }

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await bidService.getMyBids();
        setBids(response.data);
      } catch (error) {
        console.error("Failed to fetch your bids:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  // cancel a bid
  const handleCancelBid = async (bidId) => {
    //if(!window.confirm("Are you sure you want to cancel this bid?")) return;
    const confirmed  = await confirmCancelBid();
    if (!confirmed) return;

    try {
        await bidService.cancelBid(bidId);
        // remove cancelled bid from state
        setBids((prevBids) => prevBids.filter((b) => b._id !== bidId));
        toast.success("Bid cancelled successfully");
    } catch (error) {
        console.error("Failed to cancel bid:", error);
        toast.error("Failed to cancel bid. Try again");
    }
  };

  const confirmCancelBid = () => {
    return new Promise((resolve) => {
      const toastId = toast(
        ({ closeToast }) => (
          <div>
            <p>Are you sure you want to cancel this bid?</p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  resolve(true);
                  toast.dismiss(toastId);
                }}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                Yes
              </button>

              <button
                onClick={() => {
                  resolve(false);
                  toast.dismiss(toastId);
                }}
                className="px-2 py-1 bg-gray-300 rounded"
              >
                No
              </button>
            </div>
          </div>
        ),
        {
          autoClose: false,
          closeOnClick: false,
        }
      );
    });
  };

  // get original customer name
  useEffect(() => {
    async function fetchName() {
      const customerId = bids.orderId?.customerId;
      if (!customerId) return setCustomerName("Unknown Customer");

      try {
        const data = await userService.getProfile(customerId);
        setCustomerName(data.name);
      } catch (error) {
        setCustomerName("Unknown Customer");
      }
    }
    fetchName();
  }, [bids]);

  if (loading) return <p>Loading your bids...</p>;

  return (
    <div className="pt-28 min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-earthbrown mb-8">My Bids</h1>

      {bids.length === 0 ? (
        <p className="text-gray-600">You have not placed any bids yet.</p>
      ) : (
        <div className="space-y-5">
          {bids.map((bid) => (
            <div
              key={bid._id}
              className="bg-white p-5 rounded-lg shadow-md border border-gray-300"
            >
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">
                  Order #{bid.orderId?.orderNumber}
                </h2>

                <span
                  className={`px-3 py-1 rounded text-sm text-white
                  ${
                    bid.status === "PENDING"
                      ? "bg-yellow-500"
                      : bid.status === "ACCEPTED"
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {bid.status?.toUpperCase()}
                </span>
              </div>

              <p className="mt-2">
                <strong>Restaurant:</strong>{" "}
                {bid.orderId?.restaurantId?.restaurantName ?? "Unknown"}
              </p>

              <p>
                <strong>Original Order Total:</strong>{" "}
                ${(bid.orderId?.total ?? 0).toFixed(2)}
              </p>

              <p className="text-green-600">
                <strong>Your Bid:</strong>{" "}
                ${Number(bid.bidAmount).toFixed(2)}
              </p>

              <p className="text-sm text-gray-400 mt-2">
                <strong>Expires In:</strong>{" "}
                <span className="font-semibold">
                    {formatTimeLeft(bid.expiresAt)}
                </span>
              </p>

              <h3 className="mt-3 font-semibold">Items:</h3>
              <ul className="list-disc list-inside text-sm">
                {bid.orderId?.items?.map((item) => (
                  <li key={item._id}>
                    {item.name} x {item.quantity}
                  </li>
                )) ?? <li>No items</li>}
              </ul>

              {/* Cancel Bid Button */}
              {bid.status === "PENDING" && (
                <button
                  onClick={() => handleCancelBid(bid._id)}
                  className="cursor-pointer mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded w-full transition-colors"
                >
                  Cancel Bid
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBids;
