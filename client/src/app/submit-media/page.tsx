"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitMedia, getAllCharacters } from '../../lib/api/media';
import type { Character } from '../../lib/api/types';

export default function SubmitMediaPage() {
  const [formData, setFormData] = useState({
    url: '',
    type: 'image' as 'image' | 'video' | 'audio',
    description: '',
    characterId: '',
  });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const charactersData = await getAllCharacters();
      setCharacters(charactersData);
    } catch (err) {
      console.error('Failed to load characters:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const mediaData = {
        url: formData.url,
        type: formData.type,
        description: formData.description || undefined,
        characterId: formData.characterId ? parseInt(formData.characterId) : undefined,
      };

      await submitMedia(mediaData);
      setSuccess(`Media submitted successfully! It will be reviewed by moderators before being published.`);

      // Reset form
      setFormData({
        url: '',
        type: 'image',
        description: '',
        characterId: '',
      });

      // Redirect to media page after a short delay
      setTimeout(() => {
        router.push('/media');
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit media';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getUrlPlaceholder = () => {
    switch (formData.type) {
      case 'video':
        return 'https://www.youtube.com/watch?v=... or https://youtu.be/...';
      case 'image':
        return 'https://www.deviantart.com/... or https://www.pixiv.net/... or https://twitter.com/... or https://instagram.com/...';
      case 'audio':
        return 'Audio URL...';
      default:
        return 'Enter media URL';
    }
  };

  const getUrlHelp = () => {
    switch (formData.type) {
      case 'video':
        return 'YouTube videos only';
      case 'image':
        return 'DeviantArt, Pixiv, Twitter, or Instagram images only';
      case 'audio':
        return 'Audio files from supported platforms';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Submit Media</h1>
          <p className="text-blue-100">Share fanart, videos, or other media with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Media Type *
            </label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="image">Image (Fanart)</option>
              <option value="video">Video (Analysis, AMV, etc.)</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              URL *
            </label>
            <input
              type="url"
              id="url"
              name="url"
              required
              value={formData.url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={getUrlPlaceholder()}
            />
            {getUrlHelp() && (
              <p className="mt-1 text-sm text-gray-500">{getUrlHelp()}</p>
            )}
          </div>

          <div>
            <label htmlFor="characterId" className="block text-sm font-medium text-gray-700 mb-2">
              Related Character (optional)
            </label>
            <select
              id="characterId"
              name="characterId"
              value={formData.characterId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No specific character</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what this media shows or why you're sharing it"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Submission Guidelines</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All submissions are reviewed by moderators before being published</li>
              <li>• Content must be appropriate and relevant to Usogui</li>
              <li>• Respect copyright and only submit content you&apos;re allowed to share</li>
              <li>• Videos must be from YouTube</li>
              <li>• Images must be from DeviantArt, Pixiv, Twitter, or Instagram</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Media'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
