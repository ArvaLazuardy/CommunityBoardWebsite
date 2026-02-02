import { useState } from 'react';
import PostItem from './components/PostItem';

function Feed({ session, username, posts, onLogout, onShowProfile, onViewProfile, onCreatePost, handleReaction, deletePost, addComment, deleteComment, formatTime }) {
    const [content, setContent] = useState('');

    const handlePost = () => {
        onCreatePost(content);
        setContent('');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Navbar */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    {/* Left side - Logo and Title */}
                    <div className="flex items-center space-x-4">
                        <img 
                            src="birdlogo.png" 
                            alt="Logo" 
                            className="w-12 h-12 object-contain opacity-80" 
                        />
                        <h1 className="text-2xl font-bold text-blue-300">
                            <span className="text-blue-600">Z</span> Community Board
                        </h1>
                    </div>
                    
                    {/* Right side - User info and buttons */}
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-400">@{username}</span>
                        <button
                            onClick={onShowProfile}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold"
                        >
                            My Profile
                        </button>
                        <button
                            onClick={onLogout}
                            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Feed Content */}
            <div className="flex flex-col items-center p-8">
                <div className="w-full max-w-xl">
                    {/* Post Creation Box */}
                    <h1 className="text-3xl font-bold text-blue-300 pb-3">
                        <span className="text-blue-600">Hello,</span> {username}!
                    </h1>
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
                                onClick={handlePost}
                                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold"
                            >
                                Post
                            </button>
                        </div>
                    </div>

                    {/* Posts List */}
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
                                formatTime={formatTime}
                                onViewProfile={onViewProfile}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Feed;