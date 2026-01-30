import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')

  // Display Posts
  async function fetchPosts() {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
    setPosts(data)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Create Posts
  async function createPost() {
    if (!content) return
    await supabase.from('posts').insert([{ content }]) // {content: content} for checking content in supabase table
    setContent('') // Clear input
    fetchPosts()   // Refresh list
  }

  // Delete Posts
  async function deletePost(id) {
    await supabase.from('posts').delete().eq('id', id)
    fetchPosts() // Refresh list
  }

  // UI
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold mb-6 text-blue-300"><span className="text-blue-600">Z</span> The Messenger App</h1>
      
      {/* Input Area */}
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

        {/* Feed Area */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center hover:bg-gray-750 transition shadow-md"
            >
              <p className="text-gray-200">{post.content}</p>
              <button 
                onClick={() => deletePost(post.id)} 
                className="text-gray-500 hover:text-red-500 transition-colors ml-4"
              >
              ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App