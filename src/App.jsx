import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import Register from './Register';
import Feed from './Feed';
import Profile from './Profile';

function App() {
  const [posts, setPosts] = useState([]);
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // for transforming each username into an email, so there's no need for actual emails
  const transformUsername = (user) => `${user.toLowerCase().trim()}@placeholderemail.com`;

  // SIGN UP & LOGIN
  async function handleSignUp(user, pass) {
    const { data, error } = await supabase.auth.signUp({
      email: transformUsername(user),
      password: pass
    });
    
    // Create profile for new user
    if (!error && data.user) {
      await supabase.from('profiles').insert([{
        id: data.user.id,
        username: user,
      }]);
      await supabase.auth.signOut();
    }
    return { data, error };
  }

  async function handleLogin(user, pass) {
    setUsername(user);
    const { error } = await supabase.auth.signInWithPassword({
      email: transformUsername(user),
      password: pass
    });
    return { error };
  }

  // Fetch username from profile when session loads
  useEffect(() => {
    if (session) {
      fetchUsername();
    }
  }, [session]);

  async function fetchUsername() {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();
    
    if (data) {
      setUsername(data.username);
    }
  }

  // check session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // LOGOUT
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // get posts with reactions and comments
  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, reactions(vote_type, user_id), comments(*, reactions(vote_type, user_id))')
      .order('created_at', { ascending: false });
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
  useEffect(() => {
    fetchPosts();
  }, []);

  // Create Post
  async function createPost(content) {
    if (!content) return;
    await supabase.from('posts').insert([{
      content,
      author: username,
      user_id: session.user.id
    }]);
    // refresh posts
    fetchPosts();
  }

  const formatTime = (dateString) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
    if (isRegistering) {
      return (
        <Register
          onRegister={handleSignUp}
          onSwitchToLogin={() => setIsRegistering(false)}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
  }

  // Main App UI
  if (showProfile) {
    return (
      <Profile
        session={session}
        username={username}
        onBack={() => setShowProfile(false)}
        supabase={supabase}
      />
    );
  }

  return (
    <Feed
      session={session}
      username={username}
      posts={posts}
      onLogout={handleLogout}
      onCreatePost={createPost}
      onShowProfile={() => setShowProfile(true)}
      handleReaction={handleReaction}
      deletePost={deletePost}
      addComment={addComment}
      deleteComment={deleteComment}
      formatTime={formatTime}
    />
  );
}

export default App;