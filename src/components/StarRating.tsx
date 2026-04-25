import React from 'react'

interface StarRatingProps {
  rating: number
  interactive?: boolean
  onRate?: (rating: number) => void
  className?: string
}

export default function StarRating({
  rating,
  interactive = false,
  onRate,
  className = ''
}: StarRatingProps) {
  const displayRating = Math.round(rating)
  
  return (
    <div className={`flex gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onRate?.(star)}
          disabled={!interactive}
          className={`text-2xl transition ${!interactive && 'cursor-default'} ${interactive && 'cursor-pointer hover:scale-110'}`}
          aria-label={`Rate ${star} stars`}
        >
          <span
            className={`${star <= displayRating ? 'fill-accent' : 'fill-slate-200'}`}
            style={{
              color: star <= displayRating ? 'var(--color-accent)' : '#e2e8f0'
            }}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  )
}
