"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

// Simple date formatter
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  // Fetch reviews
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const response = await reviewsApi.getByProduct(productId, { limit: 10 });
      return response.data;
    },
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      rating: number;
      title?: string;
      comment: string;
    }) => reviewsApi.create(data),
    onSuccess: () => {
      toast.success("Review submitted! It will be visible after approval.");
      setShowReviewForm(false);
      setRating(5);
      setTitle("");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit review");
    },
  });

  // Mark helpful mutation
  const markHelpfulMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.markHelpful(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please write a review");
      return;
    }
    createReviewMutation.mutate({
      productId,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
    });
  };

  const reviews = data?.reviews || [];
  const averageRating = data?.averageRating || 0;
  const totalReviews = data?.pagination?.total || 0;

  return (
    <div className="mt-16">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xl ${
                      star <= Math.round(averageRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-600">
                {averageRating.toFixed(1)} out of 5 ({totalReviews} reviews)
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              {showReviewForm ? "Cancel" : "Write a Review"}
            </button>
          ) : (
            <a
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Login to write a review
            </a>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form
            onSubmit={handleSubmitReview}
            className="bg-gray-50 rounded-xl p-6 mb-8"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Write Your Review
            </h3>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition ${
                      star <= rating ? "text-yellow-400" : "text-gray-300"
                    } hover:scale-110`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your review"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createReviewMutation.isPending
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-6">
                <div className="flex gap-2 mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600">
              Be the first to review this product!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review: any) => (
              <div
                key={review.id}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= review.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      {review.title && (
                        <span className="font-semibold text-gray-900">
                          {review.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-medium text-gray-700">
                        {review.user?.name || "Anonymous"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(review.createdAt)}</span>
                      {review.isFeatured && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-600 font-medium">
                            ⭐ Featured
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-3">
                  {review.comment}
                </p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {review.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Review image ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Helpful Button */}
                <button
                  onClick={() => markHelpfulMutation.mutate(review.id)}
                  className="text-sm text-gray-500 hover:text-primary-600 transition flex items-center gap-1"
                >
                  <span>👍</span>
                  <span>Helpful ({review.helpfulCount})</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
