"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";

export default function SupplierPage() {
  const params = useSearchParams();

  const supplier = {
    name: params.get("name") || "Shenzhen Tech Co.",
    platform: params.get("platform") || "Alibaba",
    category: params.get("category") || "Electronics",
    moq: Number(params.get("moq")) || 100,
    rating: 4.5,
    reviewsCount: 120,
    description:
      "High-performance supplier specializing in consumer electronics and scalable production. Known for consistent quality, fast fulfillment cycles, and competitive pricing. Ideal for dropshipping and bulk sourcing strategies.",
  };

  const ratingStats = [92, 75, 55, 30, 12];

  const [reviews, setReviews] = useState([
    {
      name: "Charlotte Hanlin",
      rating: 5,
      comment:
        "Amazing supplier. Fast delivery and great product quality 🔥",
    },
    {
      name: "Alfonzo Schuessler",
      rating: 4,
      comment:
        "Good experience overall. Communication was smooth.",
    },
  ]);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  const addReview = () => {
    if (!newComment) return;

    setReviews([
      { name: "You", rating: newRating, comment: newComment },
      ...reviews,
    ]);

    setNewComment("");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* HEADER + CONTACT */}
          <div className="
            bg-white/5 border border-white/10 rounded-2xl p-6
            flex flex-col lg:flex-row lg:justify-between gap-6
          ">
            
            {/* INFO */}
            <div className="flex-1">

              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">
                  {supplier.name}
                </h1>

                <span className="
                  text-xs px-2 py-1 rounded-full
                  bg-red-500/10 border border-red-500
                  text-red-500
                  shadow-[0_0_10px_rgba(239,68,68,0.6)]
                ">
                  🔥 Trending
                </span>
              </div>

              <p className="text-gray-400 mt-1">
                {supplier.platform} • {supplier.category}
              </p>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-300">
                <span>MOQ: {supplier.moq}</span>
                <span>Verified Supplier</span>
                <span>Fast Shipping</span>
              </div>

              <p className="text-gray-300 mt-4 text-sm leading-relaxed max-w-2xl">
                {supplier.description}
              </p>
            </div>

            {/* CONTACT */}
            <div className="
              lg:w-64 w-full
              bg-white/5 border border-white/10 rounded-xl p-4
              flex flex-col gap-4
            ">
              <p className="text-sm text-gray-400">
                MOQ: {supplier.moq}
              </p>

              <button
                className="
                w-full py-3 rounded-full text-sm font-medium
                bg-red-500 text-white
                shadow-[0_0_20px_rgba(239,68,68,0.6)]
                hover:shadow-[0_0_40px_rgba(239,68,68,0.9)]
                transition-all
              "
              >
                Contact Supplier
              </button>
            </div>
          </div>

          {/* AI INSIGHTS */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
              AI Insights
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Profit Score</p>
                <p className="text-red-500 font-semibold text-lg">92</p>
                <div className="h-1 mt-2 bg-white/10 rounded-full">
                  <div className="h-full bg-red-500 w-[92%]" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Est. Margin</p>
                <p className="text-white font-semibold">38%</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Reliability</p>
                <p className="text-white font-semibold">High</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Delivery</p>
                <p className="text-white font-semibold">5–7 days</p>
              </div>

            </div>
          </div>

          {/* RATING */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-6">
              <span className="text-4xl font-semibold">
                {supplier.rating}
              </span>

              <div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(supplier.rating)
                          ? "text-red-500 fill-red-500"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-400 text-sm">
                  {supplier.reviewsCount} reviews
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {ratingStats.map((value, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs w-6 text-gray-400">
                    {5 - i}
                  </span>

                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REVIEWS */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-6">
              Reviews
            </h2>

            <div className="space-y-6">
              {reviews.map((r, i) => (
                <div key={i} className="flex gap-4">

                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">
                    {r.name[0]}
                  </div>

                  <div className="flex-1">

                    <div className="flex justify-between items-center">
                      <p className="font-medium">{r.name}</p>

                      <div className="flex">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className={`w-4 h-4 ${
                              j < r.rating
                                ? "text-red-500 fill-red-500"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mt-2">
                      {r.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT (ONLY REVIEW FORM NOW) */}
        <div className="space-y-6">

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Write a Review
            </h2>

            <div className="flex gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  onClick={() => setNewRating(i + 1)}
                  className={`w-5 h-5 cursor-pointer ${
                    i < newRating
                      ? "text-red-500 fill-red-500"
                      : "text-gray-600"
                  }`}
                />
              ))}
            </div>

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience..."
              className="
              w-full p-3 rounded-xl
              bg-white/5 border border-white/10
              text-sm text-white
            "
            />

            <button
              onClick={addReview}
              className="
              mt-4 w-full py-2 rounded-full text-sm
              bg-red-500 text-white
              shadow-[0_0_20px_rgba(239,68,68,0.6)]
            "
            >
              Submit Review
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}