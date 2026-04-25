'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import StarRating from './StarRating';

interface RatingModalProps {
  site: {
    id: string;
    name: string;
  };
  onRate: (rating: number) => void;
  onClose: () => void;
  isOpen?: boolean;
}

export function RatingModal({ site, onRate, onClose, isOpen = true }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onRate(rating);
      setRating(0);
      setComment('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rate ${site.name}`}
      footer={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            disabled={rating === 0}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      }
    >
      <div className="flex justify-center mb-6">
        <StarRating
          rating={rating}
          interactive
          onRate={setRating}
          className="gap-2"
        />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)"
        className="w-full border-2 border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-primary"
        rows={3}
      />
    </Modal>
  );
}
