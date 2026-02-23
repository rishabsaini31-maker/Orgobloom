"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "@/lib/api";
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

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch reviews
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reviews", statusFilter],
    queryFn: async () => {
      const response = await reviewsApi.getAll({
        limit: 50,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      return response.data;
    },
  });

  // Moderate review mutation
  const moderateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isApproved?: boolean; isFeatured?: boolean } }) =>
      reviewsApi.moderate(id, data),
    onSuccess: () => {
      toast.success("Review updated successfully");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update review");
    },
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => {
      toast.success("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete review");
    },
  });

  const handleApprove = (id: string) => {
    moderateMutation.mutate({ id, data: { isApproved: true } });
  };

  const handleReject = (id: string) => {
    moderateMutation.mutate({ id, data: { isApproved: false } });
  };

  const handleFeature = (id: string, isFeatured: boolean) => {
    moderateMutation.mutate({ id, data: { isFeatured } });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteMutation.mutate(id);
    }
  };

  const reviews = data?.reviews || [];

  // Stats
  const pendingCount = reviews.filter((r: any) => !r.isApproved).length;
  const approvedCount = reviews.filter((r: any) => r.isApproved).length;
  const featuredCount = reviews.filter((r: any) => r.isFeatured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600">Moderate and manage customer reviews</p>
        </div>
        <button
          onClick={() => refetch()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-gray-900">{reviews.length}</div>
          <div className="text-gray-600">Total Reviews</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-gray-600">Pending Approval</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
          <div className="text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{featuredCount}</div>
          <div className="text-gray-600">Featured</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {["all", "pending", "approved"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  statusFilter === status
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Reviews List */}
        <div className="p-6">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-600">
                {statusFilter === "pending"
                  ? "No reviews pending approval"
                  : statusFilter === "approved"
                    ? "No approved reviews"
                    : "No reviews have been submitted yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review: any) => (
                <div
                  key={review.id}
                  className={`border rounded-lg p-6 ${
                    review.isApproved ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      {/* Rating & Title */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${
                                star <= review.rating ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {review.title && (
                          <span className="font-semibold text-gray-900">{review.title}</span>
                        )}
                        {review.isFeatured && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            ⭐ Featured
                          </span>
                        )}
                        {!review.isApproved && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <span className="font-medium text-gray-700">
                          {review.user?.name || review.user?.email || "Anonymous"}
                        </span>
                        <span>•</span>
                        <span>{formatDate(review.createdAt)}</span>
                        <span>•</span>
                        <span className="text-primary-600">
                          Product: {review.product?.name || "Unknown"}
                        </span>
                      </div>

                      {/* Comment */}
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((img: string, idx: number) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Review image ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {/* Helpful Count */}
                      <div className="text-sm text-gray-500 mt-2">
                        👍 {review.helpfulCount} people found this helpful
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {!review.isApproved ? (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            disabled={moderateMutation.isPending}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            disabled={moderateMutation.isPending}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleFeature(review.id, !review.isFeatured)}
                          disabled={moderateMutation.isPending}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                            review.isFeatured
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {review.isFeatured ? "Remove Feature" : "Feature"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deleteMutation.isPending}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}