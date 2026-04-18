'use client';

import { useState } from 'react';
import { X, Star } from 'lucide-react';

interface RatingModalProps {
  site: {
    id: string;
    name: string;
  };
  onRate: (rating: number) => void;
  onClose: () => void;
}

export function RatingModal({ site, onRate, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onRate(rating);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 max-w-lg mx-auto">
      <div className="bg-white rounded-3xl p-6 w-11/12 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Rate {site.name}</h2>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-6 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating
                    ? 'fill-[#FFD520] text-[#FFD520]'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)"
          className="w-full border-2 border-slate-200 rounded-xl p-3 mb-4 resize-none focus:outline-none focus:border-[#00A959]"
          rows={3}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 py-3 rounded-xl bg-[#00A959] text-white font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
