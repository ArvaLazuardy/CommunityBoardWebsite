import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // for transforming each username into an email, so there's no need for actual emails
  const transformUsername = (user) => `${user.toLowerCase().trim()}@placeholderemail.com`;

  // SGIN UP & LOGIN 
  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({ email: transformUsername(username), password: password });
    if (error) { setMessage(error.message); setMessageType('error'); } 
    else { await supabase.auth.signOut(); setMessage("Account Created! Login now."); setMessageType('success'); setIsRegistering(false); }
    setTimeout(() => setMessage(''), 4000); 
  }
  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email: transformUsername(username), password: password });
    if (error) { setMessage("Incorrect Username/Password"); setMessageType('error'); setTimeout(() => setMessage(''), 4000); }
  }

  // check session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // LOGOUT
  async function handleLogout() { 
    await supabase.auth.signOut(); 
  }

  // get posts with reactions and comments
  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, reactions(vote_type, user_id), comments(*, reactions(vote_type, user_id))')
      .order('created_at', { ascending: false })
    // get likes/dislikes count
    const formattedPosts = data.map(post => {
      const likes = post.reactions.filter(r => r.vote_type === 'like').length;
      const dislikes = post.reactions.filter(r => r.vote_type === 'dislike').length;
      // sort comments by created_at(timestamp)
      const sortedComments = post.comments.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      // get likes/dislikes for comments
      const formattedComments = sortedComments.map(comment => ({
        ...comment,
        likes: comment.reactions?.filter(r => r.vote_type === 'like').length || 0,
        dislikes: comment.reactions?.filter(r => r.vote_type === 'dislike').length || 0
      }));
      // return post with counts and formatted comments
      return { ...post, likes, dislikes, comments: formattedComments };
    });
    setPosts(formattedPosts);
  }

  // fetch posts on load and after any change
  useEffect(() => { fetchPosts(); }, [])

  // Create Post
  async function createPost() {
    if (!content) return
    await supabase.from('posts').insert([{ 
      content, 
      author: username, 
      user_id: session.user.id 
    }])
    setContent(''); 
    // refresh posts
    fetchPosts();
  }

  // Soft Delete for Posts (doesn't remove, just marks as deleted sort of like reddit)
  async function deletePost(id) {
    await supabase
    .from('posts')
    .update({ 
      is_deleted: true, 
      content: "[This post has been removed by the user]", 
      author: username 
    })
    .eq('id', id);
    // refresh posts
    fetchPosts();
  }

  // Soft Delete for Comments
  async function deleteComment(commentId) {
    await supabase.from('comments').update({
      is_deleted: true,
      content: "[This comment has been removed by the user]",
      author: username
    }).eq('id', commentId);
    fetchPosts();
  }

  // add comment or reply
  async function addComment(postId, commentText, parentId = null) {
    if (!commentText) return;
    await supabase.from('comments').insert([{
      post_id: postId,
      parent_comment_id: parentId,
      user_id: session.user.id,
      author: username,
      content: commentText
    }]);
    fetchPosts(); 
  }

  // handle likes and dislikes for posts and comments
  async function handleReaction(id, type, target = 'post') {
    //
    if (!session) return;
    // Determine id based on target
    const column = target === 'post' ? 'post_id' : 'comment_id';
    
    // Check if reaction exists
    const { data: existing } = await supabase
      .from('reactions')
      .select('*')
      .eq(column, id)
      .eq('user_id', session.user.id)
      .single();
    
    // if exists, update or delete
    if (existing) {
      // remove reaction if same type or update to new type
      if (existing.vote_type === type) { 
        await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id);
      } else { 
        await supabase
        .from('reactions')
        .update({ vote_type: type })
        .eq('id', existing.id);
      }
    
    // if not exists, create new reaction
    } else {
      await supabase
      .from('reactions')
      .insert([{ [column]: id, user_id: session.user.id, vote_type: type }]);
    }
    fetchPosts();
  }

  // If no session, show login/register form
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
          <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">
            {isRegistering ? 'Z Register' : 'Z Login'}</h1>
          {message && <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{message}</div>}
          <div className="space-y-4">

            {/* INPUTS & BUTTONS */}
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500" 
              onChange={(e) => setUsername(e.target.value)} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500" 
              onChange={(e) => setPassword(e.target.value)} />
            <button 
              onClick={isRegistering ? handleSignUp : handleLogin} 
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold">
                {isRegistering ? 'Create Account' : 'Log In'}
            </button>
            <button 
              onClick={() => setIsRegistering(!isRegistering)} 
              className="w-full text-blue-400 text-sm hover:underline">
                {isRegistering ? 'Already have an account? Login' : 'New here? Register Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main App UI
  return (
    <div className="relative min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <img src="birdlogo.png" alt="Logo" className="absolute top-8 right-8 w-24 h-24 object-contain opacity-80" />
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold mb-6 text-blue-300">
          <span className="text-blue-600">
            Z
            </span> 
            The Community Board
            </h1>

        <button 
          onClick={handleLogout} 
          className="mb-6 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full font-bold">
            Logout
            </button>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-8 shadow-lg">
          <textarea className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder-gray-500 outline-none" 
            rows="3" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="Any Zthings on your mind?" />

          <div className="flex justify-end border-t border-gray-700 pt-3">
            <button 
              onClick={createPost} 
              className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-full font-bold">
                Post
                </button>

          </div>
        </div>

        <hr className="border-gray-700 mb-8" />
        <div className="space-y-4">
          {posts.map((post) => (
            <PostItem 
              key={post.id} 
              post={post} 
              session={session} 
              handleReaction={handleReaction} 
              deletePost={deletePost} 
              addComment={addComment} 
              deleteComment={deleteComment} 
              />
          ))}
        </div>
      </div>
    </div>
  )
}

// Post Component
function PostItem({ post, session, handleReaction, deletePost, addComment, deleteComment }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const myVote = post.reactions?.find(r => r.user_id === session?.user?.id)?.vote_type;

// displaying post content, reactions, comments  
  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
      <div className="flex justify-between items-start mb-2">
        <span className="text-blue-400 text-sm font-bold">
          {post.author}
          </span>
        {!post.is_deleted && session?.user?.id === post.user_id && (
          <button 
            onClick={() => deletePost(post.id)} 
            className="text-gray-500 hover:text-red-500">
              ✕
              </button>
        )}
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
              className={`flex items-center space-x-1 ${myVote === 'like' ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
              <span>
                👍
                </span> 
                <span>
                  {post.likes || 0}
                  </span>
            </button>

            <button 
              onClick={() => handleReaction(post.id, 'dislike', 'post')} 
              className={`flex items-center space-x-1 ${myVote === 'dislike' ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
              <span>
                👎
                </span> 
                <span>
                  {post.dislikes || 0}
                  </span>
            </button>
          </>
        )}

        {/* Comments Toggle */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-gray-400 hover:text-blue-400 text-sm font-bold flex items-center space-x-1">
          <span>
            💬
            </span> 
            <span>
              {post.comments?.length || 0} 
              Comments
              </span>
        </button>
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
              onClick={() => { addComment(post.id, commentInput); setCommentInput(''); }} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-xs font-bold">
                Post Comment
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Comment Component
function CommentItem({ comment, allComments, postId, session, handleReaction, deleteComment, addComment }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const childReplies = allComments.filter(c => c.parent_comment_id === comment.id);
  const myVote = comment.reactions?.find(r => r.user_id === session?.user?.id)?.vote_type;

  // displaying comments and their replies
  return (
    <div className="mt-3 ml-4 pl-4 border-l border-gray-700">
      <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-600">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-blue-400 font-bold">{comment.author}</span>
          {!comment.is_deleted && session?.user?.id === comment.user_id && (
            <button 
              onClick={() => deleteComment(comment.id)} 
              className="text-gray-500 hover:text-red-500">
                ✕
                </button>
          )}
        </div>
        <p className={`text-gray-200 text-sm mb-2 ${comment.is_deleted ? 'italic text-gray-400' : ''}`}>
          {comment.content}
          </p>
        <div className="flex items-center space-x-4 text-xs">
          {!comment.is_deleted && (
            <>
              <button 
                onClick={() => handleReaction(comment.id, 'like', 'comment')} 
                className={myVote === 'like' ? 'text-green-400 font-bold' : 'text-gray-400'}>
                  👍 
                  {comment.likes}
                  </button>
              <button 
                onClick={() => handleReaction(comment.id, 'dislike', 'comment')} 
                className={myVote === 'dislike' ? 'text-red-400 font-bold' : 'text-gray-400'}>
                  👎 
                  {comment.dislikes}
                  </button>
              <button 
                onClick={() => setIsReplying(!isReplying)} 
                className="text-blue-400 hover:underline">
                  Reply
                  </button>
            </>
          )}
        </div>
        {isReplying && (
          <div className="mt-2 flex space-x-2">
            <input className="flex-1 bg-gray-900 border border-gray-600 rounded p-1 text-xs text-white outline-none" value={replyInput} onChange={(e) => setReplyInput(e.target.value)} placeholder="Write a reply..." />
            <button 
              onClick={() => { addComment(postId, replyInput, comment.id); setReplyInput(''); setIsReplying(false); }} 
              className="bg-blue-600 px-2 py-1 rounded text-xs font-bold text-white">
                Post
                </button>
          </div>
        )}
      </div>
      {childReplies.map(reply => (
        <CommentItem key={reply.id} comment={reply} allComments={allComments} postId={postId} session={session} handleReaction={handleReaction} deleteComment={deleteComment} addComment={addComment} />
      ))}
    </div>
  );
}

export default App
