import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import RestaurantReviews from '../restaurants/RestaurantReviews';
import { reviewService } from '../api/services/review.service';
import { useAuth } from '../hooks/useAuth';

// Mock dependencies
vi.mock('../api/services/review.service');
vi.mock('../hooks/useAuth');

describe('RestaurantReviews', () => {
  const mockCustomerUser = {
    _id: 'customer123',
    role: 'customer',
    email: 'customer@example.com'
  };

  const mockRestaurantUser = {
    _id: 'restaurant123',
    role: 'restaurant',
    email: 'restaurant@example.com'
  };

  const mockReviews = [
    {
      _id: 'review1',
      restaurantId: 'restaurant123',
      customerId: {
        _id: 'customer1',
        name: 'John Doe'
      },
      orderId: 'order1',
      rating: 5,
      comment: 'Amazing food and great service!',
      ratings: {
        food: 5,
        service: 5,
        delivery: 4,
        value: 5
      },
      verified: true,
      helpfulCount: 3,
      response: null,
      createdAt: new Date('2025-01-15T12:00:00Z').toISOString()
    },
    {
      _id: 'review2',
      restaurantId: 'restaurant123',
      customerId: {
        _id: 'customer2',
        name: 'Jane Smith'
      },
      orderId: 'order2',
      rating: 4,
      comment: 'Good food but delivery was slow',
      ratings: {
        food: 5,
        service: 3,
        delivery: 3,
        value: 4
      },
      verified: true,
      helpfulCount: 1,
      response: {
        text: 'Thank you for your feedback!',
        respondedAt: new Date('2025-01-16T10:00:00Z').toISOString()
      },
      createdAt: new Date('2025-01-14T14:00:00Z').toISOString()
    },
    {
      _id: 'review3',
      restaurantId: 'restaurant123',
      customerId: {
        _id: 'customer3',
        name: 'Bob Johnson'
      },
      orderId: null,
      rating: 3,
      comment: 'Average experience',
      verified: false,
      helpfulCount: 0,
      response: null,
      createdAt: new Date('2025-01-13T16:00:00Z').toISOString()
    }
  ];

  const mockStats = {
    averageRating: 4.0,
    totalReviews: 3,
    ratingDistribution: {
      5: 1,
      4: 1,
      3: 1,
      2: 0,
      1: 0
    },
    detailedRatings: {
      food: 5.0,
      service: 4.0,
      delivery: 3.5,
      value: 4.5
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Component should fetch and display reviews for a restaurant
  test('should fetch and display reviews for a restaurant', async () => {
    useAuth.mockReturnValue({ user: null });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: mockReviews,
      stats: mockStats,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(reviewService.getByRestaurant).toHaveBeenCalledWith('restaurant123', expect.any(Object));
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Amazing food and great service!')).toBeInTheDocument();
  });

  // Test 2: Should display average rating and total reviews
  test('should display average rating and total reviews in stats', async () => {
    useAuth.mockReturnValue({ user: null });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: mockReviews,
      stats: mockStats,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByText('4.0')).toBeInTheDocument();
      expect(screen.getByText(/3 reviews/i)).toBeInTheDocument();
    });
  });

  // Test 3: Customer should be able to create a review
  test('should allow customer to create a review', async () => {
    useAuth.mockReturnValue({ user: mockCustomerUser });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: [],
      stats: { averageRating: 0, totalReviews: 0 },
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
    });
    
    const newReview = {
      _id: 'review4',
      restaurantId: 'restaurant123',
      customerId: mockCustomerUser._id,
      rating: 5,
      comment: 'Excellent!'
    };
    
    reviewService.create.mockResolvedValue(newReview);

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /write a review/i })).toBeInTheDocument();
    });

    const writeReviewButton = screen.getByRole('button', { name: /write a review/i });
    fireEvent.click(writeReviewButton);

    // Fill in review form
    const ratingInput = screen.getByLabelText(/rating/i);
    const commentInput = screen.getByLabelText(/comment/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.change(ratingInput, { target: { value: '5' } });
    fireEvent.change(commentInput, { target: { value: 'Excellent!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(reviewService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantId: 'restaurant123',
          rating: 5,
          comment: 'Excellent!'
        })
      );
    });
  });

  // Test 5: Customer should be able to update their own review
  test('should allow customer to update their own review', async () => {
    const customerReview = {
      ...mockReviews[0],
      customerId: { _id: mockCustomerUser._id, name: 'John Doe' }
    };

    useAuth.mockReturnValue({ user: mockCustomerUser });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: [customerReview],
      stats: mockStats,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    });

    const updatedReview = { ...customerReview, rating: 4, comment: 'Updated comment' };
    reviewService.update.mockResolvedValue(updatedReview);

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const ratingInput = screen.getByLabelText(/rating/i);
    const commentInput = screen.getByLabelText(/comment/i);
    const saveButton = screen.getByRole('button', { name: /save/i });

    fireEvent.change(ratingInput, { target: { value: '4' } });
    fireEvent.change(commentInput, { target: { value: 'Updated comment' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(reviewService.update).toHaveBeenCalledWith(
        'review1',
        expect.objectContaining({
          rating: 4,
          comment: 'Updated comment'
        })
      );
    });
  });

  // Test 6: Customer should be able to delete their own review
  test('should allow customer to delete their own review', async () => {
    const customerReview = {
      ...mockReviews[0],
      customerId: { _id: mockCustomerUser._id, name: 'John Doe' }
    };

    useAuth.mockReturnValue({ user: mockCustomerUser });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: [customerReview],
      stats: mockStats,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    });

    reviewService.delete.mockResolvedValue({ success: true, message: 'Review deleted' });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(reviewService.delete).toHaveBeenCalledWith('review1');
    });
  });

  // Test 7: Restaurant owner should be able to respond to reviews
  test('should allow restaurant owner to respond to reviews', async () => {
    useAuth.mockReturnValue({ user: mockRestaurantUser });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: [mockReviews[0]],
      stats: mockStats,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    });

    const reviewWithResponse = {
      ...mockReviews[0],
      response: { text: 'Thank you!', respondedAt: new Date().toISOString() }
    };
    reviewService.respond.mockResolvedValue(reviewWithResponse);

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /respond/i })).toBeInTheDocument();
    });

    const respondButton = screen.getByRole('button', { name: /respond/i });
    fireEvent.click(respondButton);

    const responseInput = screen.getByLabelText(/response/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.change(responseInput, { target: { value: 'Thank you!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(reviewService.respond).toHaveBeenCalledWith('review1', 'Thank you!');
    });
  });

  // Test 8: Users should be able to mark reviews as helpful
  test('should allow users to mark reviews as helpful', async () => {
    useAuth.mockReturnValue({ user: mockCustomerUser });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: mockReviews,
      stats: mockStats,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
    });

    reviewService.markHelpful.mockResolvedValue({
      success: true,
      helpful: true,
      helpfulCount: 4
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByText('3 found this helpful')).toBeInTheDocument();
    });

    const helpfulButtons = screen.getAllByRole('button', { name: /helpful/i });
    fireEvent.click(helpfulButtons[0]);

    await waitFor(() => {
      expect(reviewService.markHelpful).toHaveBeenCalledWith('review1');
    });
  });

  // Test 9: Should filter reviews by rating
  test('should filter reviews by rating', async () => {
    useAuth.mockReturnValue({ user: null });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: mockReviews,
      stats: mockStats,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByText('5 Stars')).toBeInTheDocument();
    });

    // Filter by 5 stars
    const fiveStarFilter = screen.getByRole('button', { name: /5 stars/i });
    fireEvent.click(fiveStarFilter);

    await waitFor(() => {
      expect(reviewService.getByRestaurant).toHaveBeenCalledWith(
        'restaurant123',
        expect.objectContaining({ rating: 5 })
      );
    });
  });

  // Test 10: Should display verified badge for verified reviews
  test('should display verified badge for verified reviews', async () => {
    useAuth.mockReturnValue({ user: null });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: mockReviews,
      stats: mockStats,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      const verifiedBadges = screen.getAllByText(/verified/i);
      expect(verifiedBadges.length).toBe(2); // Two verified reviews
    });
  });

  // Test 11: Should display restaurant owner responses
  test('should display restaurant owner responses', async () => {
    useAuth.mockReturnValue({ user: null });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: mockReviews,
      stats: mockStats,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
    });
  });

  // Test 12: Should handle pagination
  test('should handle pagination correctly', async () => {
    useAuth.mockReturnValue({ user: null });
    reviewService.getByRestaurant.mockResolvedValue({
      reviews: mockReviews,
      stats: mockStats,
      pagination: { total: 25, page: 1, limit: 10, totalPages: 3 }
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(reviewService.getByRestaurant).toHaveBeenCalledWith(
        'restaurant123',
        expect.objectContaining({ page: 2 })
      );
    });
  });

  // Test 13: Should display error when fetching reviews fails
  test('should display error message when fetching reviews fails', async () => {
    useAuth.mockReturnValue({ user: null });
    const errorMessage = 'Failed to fetch reviews';
    reviewService.getByRestaurant.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  // Test 14: Should display loading state while fetching reviews
  test('should display loading state while fetching reviews', async () => {
    useAuth.mockReturnValue({ user: null });
    reviewService.getByRestaurant.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RestaurantReviews restaurantId="restaurant123" />);

    expect(screen.getByText(/loading reviews/i)).toBeInTheDocument();
  });

  // Test 15: Should prevent duplicate reviews from same customer
  test('should prevent duplicate reviews from same customer', async () => {
    useAuth.mockReturnValue({ user: mockCustomerUser });
    
    const errorMessage = 'You have already reviewed this restaurant';
    reviewService.create.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    reviewService.getByRestaurant.mockResolvedValue({
      reviews: [],
      stats: { averageRating: 0, totalReviews: 0 },
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
    });

    render(<RestaurantReviews restaurantId="restaurant123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /write a review/i })).toBeInTheDocument();
    });

    const writeReviewButton = screen.getByRole('button', { name: /write a review/i });
    fireEvent.click(writeReviewButton);

    const ratingInput = screen.getByLabelText(/rating/i);
    const commentInput = screen.getByLabelText(/comment/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.change(ratingInput, { target: { value: '5' } });
    fireEvent.change(commentInput, { target: { value: 'Great!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});