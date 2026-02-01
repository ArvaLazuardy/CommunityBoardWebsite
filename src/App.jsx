import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  // States  
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState(''); // holds text
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Transform username to email format
  const transformUsername = (user) => `${user.toLowerCase().trim()}@placeholderemail.com`;

  // Sign Up & Login
  async function handleSignUp() {
    const { data, error } = await supabase.auth.signUp({
      email: transformUsername(username),
      password: password,
    });
  if (error) {
      setMessage(error.message);
      setMessageType('error');
    } else {
      await supabase.auth.signOut(); // Log out the user after sign-up (so they can log in manually / verify if they succeeded)
      setMessage("Account Created! You can now log in.");
      setMessageType('success');
      setIsRegistering(false); 
    }
    // Clear message after 4 seconds
    setTimeout(() => setMessage(''), 4000); 
  }

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email: transformUsername(username),
      password: password,
    });
  if (error) {
      setMessage("Incorrect Username/Password");
      setMessageType('error');
      setTimeout(() => setMessage(''), 4000); 
    }
  }

  // Login State Listener
  useEffect(() => {
    // Check if a user is already logged in when the page loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // it triggers as soon as handleLogin succeeds
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session) // This changes session from null to the user object
    })

    // remove listener on unmount
    return () => subscription.unsubscribe()
  }, [])

  // Logout
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
  }

  // Display Posts
  async function fetchPosts() {
    const { data } = await supabase.from('posts').select('*, reactions(vote_type, user_id)').order('created_at', { ascending: false })

    const formattedPosts = data.map(post => {
      const likes = post.reactions.filter(reaction => reaction.vote_type === 'like').length;
      const dislikes = post.reactions.filter(reaction => reaction.vote_type === 'dislike').length;
      return { ...post, likes, dislikes };
    });
    setPosts(formattedPosts);
  }

  // Fetch posts when website loads
  useEffect(() => {
    fetchPosts();
  }, [])

  // Create Posts
  async function createPost() {
    if (!content) return
    await supabase.from('posts').insert([{ 
        content: content, 
        author: username, 
        user_id: session.user.id 
      }])          // checking in supabase table
    setContent('') // Clear input
    fetchPosts()   // Refresh list
  }

  // Delete Posts
  async function deletePost(id) {
    await supabase.from('posts').delete().eq('id', id)
    fetchPosts() // Refresh list
  }

  async function handleReaction(postId, newVoteType) {
  if (!session) {
    return;
  }

  const { data: existing } = await supabase
    .from('reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', session.user.id)
    .single();

  if (existing) {
      if (existing.vote_type === newVoteType) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('reactions').update({ vote_type: newVoteType }).eq('id', existing.id);
      }
    } else {
      await supabase.from('reactions').insert([
        { post_id: postId, user_id: session.user.id, vote_type: newVoteType }
      ]);
    }
    fetchPosts(); 
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
          <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">
            {isRegistering ? 'Z Register' : 'Z Login'}
          </h1>
          {message && (
            <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {message}
            </div>
          )}  
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500"
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <button 
              onClick={isRegistering ? handleSignUp : handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold transition-all text-white"
            >
              {isRegistering ? 'Create Account' : 'Log In'}
            </button>

            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-blue-400 text-sm hover:underline"
            >
              {isRegistering ? 'Already have an account? Login' : 'New here? Register Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // UI
return (
    <div className="relative min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      
      <img 
        src="birdlogo.png" 
        alt="Logo" 
        className="absolute top- right-8 w-100 h-100 object-contain opacity-80" 
      />

      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold mb-6 text-blue-300">
          <span className="text-blue-600">Z</span> The Community Board
        </h1>
        <button 
          onClick={handleLogout} 
          className="mb-6 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full font-bold transition-colors text-gray-100 hover:text-gray-400"
        >
          Logout
        </button>

        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-8 shadow-lg">
          <textarea 
            className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder-gray-500 outline-none"
            rows="3"
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="Any Zthings on your mind?"
          />
          <div className="flex justify-end border-t border-gray-700 pt-3">
            <button 
              onClick={createPost} 
              className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-full font-bold transition-colors text-gray-100 hover:text-gray-400"
            >
              Post
            </button>
          </div>
        </div>

        <hr className="border-gray-700 mb-8" />

        <div className="space-y-4">
          {posts.map((post) => {
            const myVote = post.reactions?.find(r => r.user_id === session?.user?.id)?.vote_type;
            return (
            <div key={post.id} 
                className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-blue-400 text-sm font-bold">{post.author || 'Anonymous'}</span>
                  {session?.user?.id === post.user_id && (
                          <button 
                            onClick={() => deletePost(post.id)} 
                            className="text-gray-500 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        )}
                </div>

                <p className="text-gray-200">{post.content}</p>
                <div className="flex items-center space-x-4 mt-4">
                  <button 
                    onClick={() => handleReaction(post.id, 'like')}
                    className={`flex items-center space-x-1 ${myVote === 'like' ? 'text-green-400 font-bold' : 'text-gray-400'}`}
                  >
                    <span>👍</span>
                    <span>{post.likes || 0}</span>
                  </button>
                  <button 
                    onClick={() => handleReaction(post.id, 'dislike')}
                    className={`flex items-center space-x-1 ${myVote === 'dislike' ? 'text-red-400 font-bold' : 'text-gray-400'}`}
                  >
                    <span>👎</span>
                    <span>{post.dislikes || 0}</span>
                  </button>
                </div>
              </div>
          );  
        })}
        </div>
      </div>
    </div>
  )
}

export default App
