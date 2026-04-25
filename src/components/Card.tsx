'use client'

import React from 'react'
import { Navigation } from 'lucide-react'
import StarRating from './StarRating'
import Button from './Button'

interface CardProps {
  id: string
  name: string
  description: string
  image?: string
  rating?: number
  onCardClick?: () => void
  onCheckIn?: () => void
  onGetDirections?: () => void
  onRate?: (rating: number) => void
  showActions?: boolean
  showCheckInButton?: boolean
  showDirectionsButton?: boolean
}

export default function Card({
  name,
  description,
  image,
  rating,
  onCardClick,
  onCheckIn,
  onGetDirections,
  onRate,
  showActions = true,
  showCheckInButton = true,
  showDirectionsButton = true
}: CardProps) {
  const handleCardClick = () => {
    if (onCardClick) onCardClick()
  }

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCheckIn?.()
  }

  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation()
    onGetDirections?.()
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-(--color-card-bg) backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm border-2 border-white hover:shadow-md transition cursor-pointer"
    >
      {image && (
        <div className="h-40 bg-linear-to-br from-purple-200 to-blue-200 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-heading font-bold text-lg mb-2">
          {name}
        </h3>
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          {description}
        </p>

        {rating !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <StarRating
              rating={rating}
              interactive={onRate !== undefined}
              onRate={onRate}
            />
            <span className="text-xs text-slate-600">{rating}/5</span>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            {showCheckInButton && onCheckIn && (
              <button
                onClick={handleCheckIn}
                className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-medium hover:bg-[#008043] active:bg-[#006633] transition"
              >
                Check In ✓
              </button>
            )}
            {showDirectionsButton && onGetDirections && (
              <button
                onClick={handleGetDirections}
                className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center gap-1"
              >
                <Navigation className="w-4 h-4" />
                Directions
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
