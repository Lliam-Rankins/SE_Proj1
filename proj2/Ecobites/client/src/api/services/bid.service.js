// src/api/services/bid.service.js
import axios from 'axios';

const API_URL = "http://localhost:3000/api/bids";

export const bidService = {
  // Get all cancelled orders available for bidding
  getCancelledOrders: async () => {
    const response = await axios.get(`${API_URL}/cancelled-orders`, {
      withCredentials: true,
    });
    return response.data;
  },

   getOrderById: async (orderId) => {
    const response = await axios.get(`${API_URL}/${orderId}`, { withCredentials: true });
    return response.data.order; // { success, order }
  },

  placeBid: async (orderId, bidData) => {
    const response = await axios.post(`${API_URL}/${orderId}/bid`, bidData, { withCredentials: true });
    return response.data.bid; // { success, bid }
  },
};
