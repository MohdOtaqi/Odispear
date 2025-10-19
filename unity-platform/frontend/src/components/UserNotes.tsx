import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, StickyNote, Calendar, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

interface UserNote {
  id: string;
  userId: string;
  targetUserId: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserNotesProps {
  targetUserId: string;
  targetUsername: string;
  targetAvatarUrl?: string;
}

export const UserNotes: React.FC<UserNotesProps> = ({
  targetUserId,
  targetUsername,
  targetAvatarUrl
}) => {
  const [note, setNote] = useState('');
  const [originalNote, setOriginalNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    loadUserNote();
  }, [targetUserId]);

  const loadUserNote = async () => {
    try {
      const response = await fetch(`/api/v1/users/${targetUserId}/note`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.note) {
          setNote(data.note.note);
          setOriginalNote(data.note.note);
          setLastSaved(new Date(data.note.updatedAt));
        }
      }
    } catch (error) {
      console.error('Failed to load user note:', error);
    }
  };

  const saveNote = async () => {
    if (note === originalNote) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/users/${targetUserId}/note`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note })
      });

      if (response.ok) {
        setOriginalNote(note);
        setLastSaved(new Date());
        setIsEditing(false);
        toast.success('Note saved');
      } else {
        toast.error('Failed to save note');
      }
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setNote(originalNote);
    setIsEditing(false);
  };

  const deleteNote = async () => {
    if (!confirm('Delete this note?')) return;

    try {
      const response = await fetch(`/api/v1/users/${targetUserId}/note`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        setNote('');
        setOriginalNote('');
        setLastSaved(null);
        toast.success('Note deleted');
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 backdrop-blur-sm border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-purple-400" />
          <h3 className="font-medium text-white">Personal Note</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-white/10 rounded transition-all"
              title="Edit note"
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
            </button>
          ) : (
            <>
              <button
                onClick={saveNote}
                disabled={isSaving}
                className="p-1.5 hover:bg-green-600/20 rounded transition-all disabled:opacity-50"
                title="Save note"
              >
                <Save className="w-4 h-4 text-green-400" />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1.5 hover:bg-red-600/20 rounded transition-all"
                title="Cancel"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="relative">
        {isEditing ? (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Add a note about ${targetUsername}...`}
            className="w-full h-32 px-3 py-2 bg-black/30 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500"
            maxLength={500}
            autoFocus
          />
        ) : (
          <div className="min-h-[80px]">
            {note ? (
              <p className="text-gray-300 whitespace-pre-wrap">{note}</p>
            ) : (
              <p className="text-gray-500 italic">
                Click the edit button to add a note about {targetUsername}
              </p>
            )}
          </div>
        )}

        {isEditing && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {note.length}/500
          </div>
        )}
      </div>

      {/* Footer */}
      {lastSaved && !isEditing && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/50">
          <Calendar className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-500">
            Last updated: {lastSaved.toLocaleDateString()} at {lastSaved.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="flex items-start gap-2 mt-3 p-2 bg-yellow-600/10 rounded text-xs text-yellow-400/80">
        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>
          This note is private and only visible to you. {targetUsername} cannot see this.
        </span>
      </div>
    </div>
  );
};

// User Notes Popup for quick access
export const UserNotesPopup: React.FC<{
  userId: string;
  username: string;
  onClose: () => void;
}> = ({ userId, username, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-purple-400" />
            Note for {username}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-all"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <UserNotes
          targetUserId={userId}
          targetUsername={username}
        />
      </div>
    </div>
  );
};
