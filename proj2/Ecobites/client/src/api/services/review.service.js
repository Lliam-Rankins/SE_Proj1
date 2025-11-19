import api from '../axios.config';

export const reviewService = {
  create: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  getByRestaurant: async (restaurantId, params = {}) => {
    const response = await api.get(`/reviews/restaurant/${restaurantId}`, { params });
    return response.data;
  },

  getMyReviews: async (params = {}) => {
    const response = await api.get('/reviews/my-reviews', { params });
    return response.data;
  },

  update: async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  delete: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  respond: async (reviewId, responseText) => {
    const response = await api.post(`/reviews/${reviewId}/response`, {
      response: responseText
    });
    return response.data;
  },

  markHelpful: async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  }
};