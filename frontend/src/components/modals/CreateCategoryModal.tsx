import React, { useState } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGuildStore } from '../../store/guildStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ isOpen, onClose }) => {
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentGuild, selectGuild } = useGuildStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !currentGuild) return;

    setIsLoading(true);
    try {
      await api.post(`/guilds/${currentGuild.id}/channels`, {
        name: categoryName.toUpperCase(),
        type: 'category'
      });

      toast.success(`Created category: ${categoryName}`);
      
      // Refresh the guild to get new channels
      await selectGuild(currentGuild.id);
      
      // Reset and close
      setCategoryName('');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-mot-surface-subtle rounded-lg p-6 w-[440px] shadow-xl border border-mot-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mot-gold flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-mot-black" />
            </div>
            <h2 className="text-xl font-bold text-white">Create Category</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Categories help organize your channels into groups. Channels can be placed inside categories.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="GENERAL"
            className="mb-6"
            required
          />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!categoryName.trim() || isLoading}
              variant="primary"
            >
              Create Category
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
