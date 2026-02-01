import { useState } from 'react';

function CommentItem({ comment, allComments, postId, session, handleReaction, deleteComment, addComment, formatTime }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const childReplies = allComments.filter(c => c.parent_comment_id === comment.id);
  const myVote = comment.reactions?.find(r => r.user_id === session?.user?.id)?.vote_type;

  return (
    <div className="mt-3 ml-4 pl-4 border-l border-gray-700">
      <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-600">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-blue-400 font-bold">{comment.author}</span>
          <span className="text-gray-400">{formatTime(comment.created_at)}</span>
        </div>
        <p className={`text-gray-200 text-sm mb-2 ${comment.is_deleted ? 'italic text-gray-400' : ''}`}>
          {comment.content}
        </p>
        <div className="flex items-center space-x-4 text-xs">
          {!comment.is_deleted && (
            <>
              <button
                onClick={() => handleReaction(comment.id, 'like', 'comment')}
                className={myVote === 'like' ? 'text-green-400 font-bold' : 'text-gray-400'}
              >
                👍 {comment.likes}
              </button>
              <button
                onClick={() => handleReaction(comment.id, 'dislike', 'comment')}
                className={myVote === 'dislike' ? 'text-red-400 font-bold' : 'text-gray-400'}
              >
                👎 {comment.dislikes}
              </button>
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-blue-400 hover:underline"
              >
                Reply
              </button>
              {!comment.is_deleted && session?.user?.id === comment.user_id && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  ✕ Delete Comment
                </button>
              )}
            </>
          )}
        </div>
        {isReplying && (
          <div className="mt-2 flex space-x-2">
            <input
              className="flex-1 bg-gray-900 border border-gray-600 rounded p-1 text-xs text-white outline-none"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder="Write a reply..."
            />
            <button
              onClick={() => {
                addComment(postId, replyInput, comment.id);
                setReplyInput('');
                setIsReplying(false);
              }}
              className="bg-blue-600 px-2 py-1 rounded text-xs font-bold text-white"
            >
              Post
            </button>
          </div>
        )}
      </div>
      {/* RECURSION: The child replies are rendered inside the parent component */}
      {childReplies.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          allComments={allComments}
          postId={postId}
          session={session}
          handleReaction={handleReaction}
          deleteComment={deleteComment}
          addComment={addComment}
          formatTime={formatTime}
        />
      ))}
    </div>
  );
}

export default CommentItem;