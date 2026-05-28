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
      <div className="bg-white rounded-2xl w-full sm:max-w-md border-[1.5px] border-[#0F172A] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0D9488] p-5 flex items-center justify-between border-b-[1.5px] border-[#0F172A]">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-white" />
            <h2 className="text-lg font-fredoka font-bold text-white">Suggest an Attraction</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-none transition border border-white/40"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Message */}
          {success && (
            <div className="bg-emerald-50 border-[1.5px] border-[#0F172A] text-emerald-700 px-4 py-3 rounded-none text-sm font-medium shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              ✓ Thanks for the suggestion! Our team will review it soon.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-[1.5px] border-[#0F172A] text-red-700 px-4 py-3 rounded-none text-sm font-medium shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              {error}
            </div>
          )}

          {/* Attraction Name */}
          <div>
            <label className="block text-sm font-fredoka text-[#2D3250] mb-2">
              Attraction Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hidden Rooftop Cafe"
              className="w-full px-4 py-3 border-[1.5px] border-[#0F172A] rounded-none focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition placeholder:text-[#8B7E74] bg-white"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-fredoka text-[#2D3250] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this place special?"
              rows={4}
              className="w-full px-4 py-3 border-[1.5px] border-[#0F172A] rounded-none focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition placeholder:text-[#8B7E74] resize-none bg-white"
              disabled={loading}
            />
          </div>

          {/* Station/Category */}
          <div>
            <label className="block text-sm font-fredoka text-[#2D3250] mb-2">
              Station / Category
            </label>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full px-4 py-3 border-[1.5px] border-[#0F172A] rounded-none focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition text-[#2D3250] bg-white"
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
            className={`w-full py-3 rounded-none font-fredoka font-bold text-white transition-all border-[1.5px] border-[#0F172A] border-b-[4px] active:border-b-0 active:translate-y-[4px] ${
              loading || success
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-[#0D9488] hover:bg-[#0F766E]'
            }`}
          >
            {loading ? 'Submitting...' : success ? '✓ Submitted!' : 'Submit Suggestion'}
          </button>

          {/* Info Text */}
          <p className="text-xs text-[#8B7E74] text-center font-fredoka">
            Your suggestion will be reviewed by our team before being added to the app.
          </p>
        </form>
      </div>
    </div>
  );
}
