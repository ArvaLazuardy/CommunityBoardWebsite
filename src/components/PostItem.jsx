import { useState } from 'react';
import CommentItem from './CommentItem';

function PostItem({ post, session, handleReaction, deletePost, addComment, deleteComment, formatTime }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const myVote = post.reactions?.find(r => r.user_id === session?.user?.id)?.vote_type;

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
      <div className="flex justify-between items-start mb-2">
        <span className="text-blue-400 text-sm font-bold">{post.author}</span>
        <span className="text-gray-400 text-xs">{formatTime(post.created_at)}</span>
      </div>

      <p className={`text-gray-200 mb-4 ${post.is_deleted ? 'italic text-gray-400' : ''}`}>
        {post.content}
      </p>
      <div className="flex items-center space-x-6 border-t border-gray-700 pt-3">
        {!post.is_deleted && (
          <>
            {/* Likes/Dislikes Buttons */}
            <button
              onClick={() => handleReaction(post.id, 'like', 'post')}
              className={`flex items-center space-x-1 ${myVote === 'like' ? 'text-green-400 font-bold' : 'text-gray-400'}`}
            >
              <span>👍</span>
              <span>{post.likes || 0}</span>
            </button>

            <button
              onClick={() => handleReaction(post.id, 'dislike', 'post')}
              className={`flex items-center space-x-1 ${myVote === 'dislike' ? 'text-red-400 font-bold' : 'text-gray-400'}`}
            >
              <span>👎</span>
              <span>{post.dislikes || 0}</span>
            </button>
          </>
        )}

        {/* Comments Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-blue-400 text-sm font-bold flex items-center space-x-1"
        >
          <span>💬</span>
          <span>{post.comments?.length || 0} Comments</span>
        </button>
        
        {/* Delete Post Button */}
        {!post.is_deleted && session?.user?.id === post.user_id && (
          <button
            onClick={() => deletePost(post.id)}
            className="text-gray-500 hover:text-red-500"
          >
            ✕ Delete Post
          </button>
        )}
      </div>

      {/* Comments Section */}
      {isExpanded && (
        <div className="mt-4">
          {post.comments?.filter(c => !c.parent_comment_id).map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={post.comments}
              postId={post.id}
              session={session}
              handleReaction={handleReaction}
              deleteComment={deleteComment}
              addComment={addComment}
              formatTime={formatTime}
            />
          ))}

          {/* Add Comment Input */}
          <div className="mt-4 flex flex-col space-y-2">
            <textarea
              placeholder="Write a comment..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-sm outline-none focus:border-blue-500 resize-none"
              rows="2"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  addComment(post.id, commentInput);
                  setCommentInput('');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-xs font-bold"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostItem;