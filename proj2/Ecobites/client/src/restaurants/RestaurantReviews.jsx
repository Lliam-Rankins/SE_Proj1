/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { reviewService } from '../api/services/review.service';
import { useAuth } from '../hooks/useAuth';
import { restaurantService } from '../api/services/restaurant.service';

const RestaurantReviews = ({ restaurantId, averageRating, totalReviews, ratingDistribution, onRatingUpdate }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(averageRating || 0);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {},
    detailedRatings: {}
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterRating, setFilterRating] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    ratings: {
      food: 5,
      service: 5,
      delivery: 5,
      value: 5
    }
  });
  const [formError, setFormError] = useState('');
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await restaurantService.getById(restaurantId);
        setSelectedRestaurant(data);
      } catch (error) {
        console.error('Failed to fetch restaurant:', error)
      }
    }

    fetchRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    fetchReviews();
  }, [restaurantId, pagination.page, filterRating]);

  useEffect(() => {
    setAvg(averageRating);
  }, [averageRating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (filterRating) {
        params.rating = filterRating;
      }

      const data = await reviewService.getByRestaurant(restaurantId, params);
      
      setReviews(data.reviews);
      setStats(data.stats);
      setPagination(data.pagination);

      // Calculate average rating & notify parent 
      if (data.reviews && data.reviews.length > 0 && onRatingUpdate) {
        const avg = data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length;
        onRatingUpdate(avg);
      } else if (onRatingUpdate) {
        // No reviews => set average to 0
        onRatingUpdate(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate rating
    if (formData.rating < 1 || formData.rating > 5) {
      setFormError('Rating must be between 1 and 5');
      return;
    }

    try {
      const response = await reviewService.create({
        restaurantId,
        rating: parseInt(formData.rating),
        comment: formData.comment,
        ratings: formData.ratings
      });

      const { review, stats } = response;
      setReviews(prev => [review, ...prev]); // add new review to state
      setStats(stats); // update avg rating

      setShowReviewForm(false);
      setFormData({
        rating: 5,
        comment: '',
        ratings: { food: 5, service: 5, delivery: 5, value: 5 }
      });

      await fetchReviews();

    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create review');
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate rating
    if (formData.rating < 1 || formData.rating > 5) {
      setFormError('Rating must be between 1 and 5');
      return;
    }

    try {
      const response = await reviewService.update(editingReview._id, {
        rating: parseInt(formData.rating),
        comment: formData.comment,
        ratings: formData.ratings
      });

      const { review, stats } = response;
      setReviews(prev => prev.map(r => r._id === review._id ? review : r));
      setStats(stats);

      setEditingReview(null);
      setFormData({
        rating: 5,
        comment: '',
        ratings: { food: 5, service: 5, delivery: 5, value: 5 }
      });

      fetchReviews();

    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await reviewService.delete(reviewId);

      const { stats } = response;
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      setStats(stats);

      setConfirmDelete(null);
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleRespondToReview = async (e, reviewId) => {
    e.preventDefault();

    try {
      await reviewService.respond(reviewId, responseText);
      setRespondingTo(null);
      setResponseText('');
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond to review');
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await reviewService.markHelpful(reviewId);
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark review as helpful');
    }
  };

  const startEdit = (review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating,
      comment: review.comment,
      ratings: review.ratings || { food: 5, service: 5, delivery: 5, value: 5 }
    });
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setFormData({
      rating: 5,
      comment: '',
      ratings: { food: 5, service: 5, delivery: 5, value: 5 }
    });
    setFormError('');
  };

  const isMyReview = (review) => {
    return user && review.customerId._id === user._id;
  };

  const isRestaurantOwner = () => {
    return user && user.role === 'restaurant' && user._id === restaurantId;
  };

  if (loading && reviews.length === 0) {
    return <div className="p-4">Loading reviews...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }


  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Stats Section */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-4xl font-bold">{avg?.toFixed(1) || 0}</div>
            <div className="text-gray-600">{totalReviews || 0} reviews</div>
          </div>
          
          {user && user.role === 'customer' && !isRestaurantOwner() && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        {ratingDistribution && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <button
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`text-sm hover:underline ${
                    filterRating === star ? 'font-bold' : ''
                  }`}
                >
                  {star} Stars
                </button>
                <div className="flex-1 bg-gray-200 rounded h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded"
                    style={{
                      width: `${
                        totalReviews > 0
                          ? ((ratingDistribution[star] || 0) / totalReviews) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {ratingDistribution[star] || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Write a Review</h3>
            <form onSubmit={handleCreateReview}>
              <div className="mb-4">
                <label htmlFor="rating" className="block text-sm font-medium mb-1">
                  Rating
                </label>
                <input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium mb-1">
                  Comment
                </label>
                <textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows="4"
                />
              </div>

              {formError && (
                <div className="mb-4 text-red-600 text-sm">{formError}</div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setFormError('');
                  }}
                  className="cursor-pointer bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white rounded-lg shadow p-6">
            {editingReview && editingReview._id === review._id ? (
              // Edit Form
              <form onSubmit={handleUpdateReview}>
                <div className="mb-4">
                  <label htmlFor={`edit-rating-${review._id}`} className="block text-sm font-medium mb-1">
                    Rating
                  </label>
                  <input
                    id={`edit-rating-${review._id}`}
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor={`edit-comment-${review._id}`} className="block text-sm font-medium mb-1">
                    Comment
                  </label>
                  <textarea
                    id={`edit-comment-${review._id}`}
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows="4"
                  />
                </div>

                {formError && (
                  <div className="mb-4 text-red-600 text-sm">{formError}</div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // Display Review
              <>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold">{review.customerId.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-yellow-500">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {isMyReview(review) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(review)}
                        className="cursor-pointer text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(review._id)}
                        className="cursor-pointer text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 mb-2">{review.comment}</p>

                {/* Helpful Button */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <button
                    onClick={() => handleMarkHelpful(review._id)}
                    className="cursor-pointer hover:text-blue-600"
                  >
                    Helpful
                  </button>
                  {review.helpfulCount > 0 && (
                    <span>{review.helpfulCount} found this helpful</span>
                  )}
                </div>

                {/* Restaurant Response */}
                {review.response && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-300 bg-gray-50 p-3 rounded">
                    <div className="font-semibold text-sm">Restaurant Response</div>
                    <p className="text-sm text-gray-700">{review.response.text}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(review.response.respondedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Respond Form (Restaurant Owner) */}
                {isRestaurantOwner() && !review.response && (
                  <>
                    {respondingTo === review._id ? (
                      <form onSubmit={(e) => handleRespondToReview(e, review._id)} className="mt-4">
                        <label htmlFor={`response-${review._id}`} className="block text-sm font-medium mb-1">
                          Response
                        </label>
                        <textarea
                          id={`response-${review._id}`}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          rows="3"
                          required
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}
                            className="cursor-pointer bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(review._id)}
                        className="cursor-pointer mt-2 text-blue-600 hover:underline text-sm"
                      >
                        Respond
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* Delete Confirmation */}
            {confirmDelete === review._id && (
              <div className="fixed inset-0 bg-gray bg-opacity-70 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                <div className="bg-white rounded-lg p-6 max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Delete Review?</h3>
                  <p className="mb-4">Are you sure you want to delete this review?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="cursor-pointer bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="cursor-pointer bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {reviews.length === 0 && (
        <div className="text-center text-gray-600 py-8">
          No reviews yet. Be the first to review!
        </div>
      )}
    </div>
  );
};

export default RestaurantReviews;