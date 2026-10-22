import React, { useState, useEffect, useRef } from 'react';
import { commentService } from '../../services/commentService';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../common/Avatar';
import { Button } from '../ui/Button';
import { formatRelativeTime } from '../../lib/utils';
import { Send, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const CommentThread = ({ taskId, workspaceMembers = [] }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const textareaRef = useRef(null);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const res = await commentService.getTaskComments(taskId);
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchComments();
    }
  }, [taskId]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewComment(val);

    // Check for @mention trigger
    const lastAtPos = val.lastIndexOf('@');
    if (lastAtPos !== -1 && (lastAtPos === 0 || val[lastAtPos - 1] === ' ')) {
      const query = val.slice(lastAtPos + 1).toLowerCase();
      if (!query.includes(' ')) {
        setMentionQuery(query);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (member) => {
    const lastAtPos = newComment.lastIndexOf('@');
    const prefix = newComment.slice(0, lastAtPos);
    const updated = `${prefix}@${member.user.name} `;
    setNewComment(updated);
    if (!selectedMentions.includes(member.user._id)) {
      setSelectedMentions([...selectedMentions, member.user._id]);
    }
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await commentService.addComment(taskId, {
        body: newComment.trim(),
        mentions: selectedMentions,
      });

      setComments([...comments, res.data]);
      setNewComment('');
      setSelectedMentions([]);
      toast.success('Comment posted');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id);
    setEditBody(comment.body);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editBody.trim()) return;
    try {
      const res = await commentService.updateComment(commentId, { body: editBody.trim() });
      setComments(comments.map((c) => (c._id === commentId ? res.data : c)));
      setEditingCommentId(null);
      toast.success('Comment updated');
    } catch (err) {
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(comments.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const filteredMembers =
    mentionQuery !== null
      ? workspaceMembers.filter((m) =>
          m.user?.name?.toLowerCase().includes(mentionQuery)
        )
      : [];

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-6 flex justify-center text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted bg-surface-2/40 rounded-xl border border-dashed border-border/80">
            No comments on this task yet. Start the conversation below!
          </div>
        ) : (
          comments.map((c) => {
            const isAuthor = c.author?._id === user?._id;
            const isEditing = editingCommentId === c._id;

            return (
              <div
                key={c._id}
                className="p-3 rounded-xl bg-surface-2/60 border border-border/60 flex items-start gap-3 group text-xs"
              >
                <Avatar
                  src={c.author?.avatarUrl}
                  name={c.author?.name || 'User'}
                  size="sm"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text">{c.author?.name}</span>
                      <span className="text-[10px] text-text-muted">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                      {c.editedAt && (
                        <span className="text-[10px] text-text-muted italic">(edited)</span>
                      )}
                    </div>

                    {isAuthor && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(c)}
                          className="p-1 rounded text-text-muted hover:text-text cursor-pointer"
                          title="Edit comment"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-1 rounded text-text-muted hover:text-danger cursor-pointer"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mt-1">
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full p-2 bg-surface rounded-lg border border-border text-xs focus:outline-none focus:border-primary"
                        rows={2}
                      />
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-2 py-1 rounded text-[11px] text-text-muted hover:bg-surface-2 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(c._id)}
                          className="px-2.5 py-1 rounded text-[11px] bg-primary text-white font-medium hover:opacity-90 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text leading-relaxed whitespace-pre-wrap">{c.body}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mention Autocomplete Popup */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="bg-surface border border-border rounded-xl shadow-lg p-1.5 max-h-40 overflow-y-auto space-y-0.5 animate-scale-in text-xs z-30">
          <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase">
            Mention Member
          </div>
          {filteredMembers.map((m) => (
            <button
              key={m.user._id}
              type="button"
              onClick={() => handleSelectMention(m)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer text-left"
            >
              <Avatar src={m.user.avatarUrl} name={m.user.name} size="xs" />
              <span className="font-medium text-text">{m.user.name}</span>
              <span className="text-[10px] text-text-muted ml-auto capitalize">{m.role}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative mt-2">
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={handleInputChange}
          placeholder="Leave a comment... (Type @ to mention teammates)"
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />

        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[10px] text-text-muted">Supports @mentions</span>
          <Button
            type="submit"
            size="xs"
            disabled={!newComment.trim() || isSubmitting}
            isLoading={isSubmitting}
            leftIcon={<Send className="w-3 h-3" />}
          >
            Comment
          </Button>
        </div>
      </form>
    </div>
  );
};
