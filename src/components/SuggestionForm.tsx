'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';

interface SuggestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SuggestionForm({ isOpen, onClose, onSuccess }: SuggestionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stationId, setStationId] = useState('');
  const [stations, setStations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch stations on mount from API
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch('/api/stations');
        if (!response.ok) throw new Error('Failed to fetch stations');
        const data = await response.json();
        setStations(data.stations || []);
      } catch (err) {
        console.error('Error fetching stations:', err);
      }
    };

    fetchStations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!name.trim()) {
      setError('Please enter an attraction name');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (!stationId) {
      setError('Please select a station/category');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          stationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit suggestion');
      }

      setSuccess(true);
      setName('');
      setDescription('');
      setStationId('');

      // Show success message for 2 seconds, then close
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full sm:max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-purple-400 to-pink-400 p-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Suggest an Attraction</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Message */}
          {success && (
            <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              ✓ Thanks for the suggestion! Our team will review it soon.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Attraction Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Attraction Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hidden Rooftop Cafe"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 transition placeholder:text-slate-400"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this place special? (e.g., best views, unique local vibe, instagrammable spots)"
              rows={4}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 transition placeholder:text-slate-400 resize-none"
              disabled={loading}
            />
          </div>

          {/* Station/Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Station / Category
            </label>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 transition text-slate-700 bg-white"
              disabled={loading}
            >
              <option value="">-- Select a station --</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className={`w-full py-3 rounded-xl font-semibold text-white transition ${
              loading || success
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-linear-to-r from-purple-500 to-pink-500 hover:shadow-lg active:scale-95'
            }`}
          >
            {loading ? 'Submitting...' : success ? '✓ Submitted!' : 'Submit Suggestion'}
          </button>

          {/* Info Text */}
          <p className="text-xs text-slate-500 text-center">
            Your suggestion will be reviewed by our team before being added to the app.
          </p>
        </form>
      </div>
    </div>
  );
}
