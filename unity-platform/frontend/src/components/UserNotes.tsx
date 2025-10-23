import React, { useState, useEffect } from 'react';
import { Save, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserNote {
  id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface UserNotesProps {
  userId: string;
  username: string;
  onClose?: () => void;
}

export const UserNotes: React.FC<UserNotesProps> = ({ userId, username, onClose }) => {
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingNote, setExistingNote] = useState<UserNote | null>(null);

  useEffect(() => {
    fetchNote();
  }, [userId]);

  const fetchNote = async () => {
    try {
      // TODO: Implement API call to fetch user note
      // const response = await axios.get(`/api/v1/users/${userId}/note`);
      // setExistingNote(response.data);
      // setNote(response.data?.note || '');
      console.log('Fetching note for user:', userId);
    } catch (error) {
      console.error('Failed to fetch note:', error);
    }
  };

  const saveNote = async () => {
    if (!note.trim()) {
      toast.error('Note cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement API call to save note
      // await axios.post(`/api/v1/users/${userId}/note`, { note });
      console.log('Saving note for user:', userId, note);
      toast.success('Note saved');
      setIsEditing(false);
      setExistingNote({
        id: 'temp-id',
        user_id: userId,
        note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      // TODO: Implement API call to delete note
      // await axios.delete(`/api/v1/users/${userId}/note`);
      console.log('Deleting note for user:', userId);
      setNote('');
      setExistingNote(null);
      toast.success('Note deleted');
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Note for {username}</h3>
          <p className="text-sm text-neutral-400">Private note only you can see</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!isEditing && existingNote ? (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-800 rounded-lg">
              <p className="text-white whitespace-pre-wrap">{existingNote.note}</p>
              <div className="mt-3 text-xs text-neutral-500">
                Last updated: {new Date(existingNote.updated_at).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Note
              </button>
              <button
                onClick={deleteNote}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Add a note about ${username}...`}
              className="w-full h-64 p-4 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">
                {note.length} / 1000 characters
              </span>
              <div className="flex gap-2">
                {isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNote(existingNote?.note || '');
                    }}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={saveNote}
                  disabled={isSaving || !note.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-4 border-t border-neutral-700 bg-neutral-850">
        <p className="text-xs text-neutral-500">
          💡 Notes are private and only visible to you. Use them to remember important details about users.
        </p>
      </div>
    </div>
  );
};