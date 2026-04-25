'use client'

import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/70 sm:items-center sm:justify-center">
      {/* Backdrop click handler */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close modal"
      />
      
      {/* Modal content */}
      <div
        className="relative w-full rounded-t-3xl bg-white p-6 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Title */}
        {title && (
          <h2 className="pr-8 text-xl font-bold text-slate-900 mb-4">
            {title}
          </h2>
        )}
        
        {/* Body */}
        <div className="mb-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-200 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
