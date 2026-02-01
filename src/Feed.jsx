import { useState } from 'react';
import PostItem from './components/PostItem';

function Feed({ session, posts, onLogout, onShowProfile, onCreatePost, handleReaction, deletePost, addComment, deleteComment, formatTime }) {
    const [content, setContent] = useState('');

    const handlePost = () => {
        onCreatePost(content);
        setContent('');
    };

    return (
        <div className="relative min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
        <img src="birdlogo.png" alt="Logo" className="absolute top-8 right-8 w-24 h-24 object-contain opacity-80" />
        <div className="w-full max-w-xl">
            <h1 className="text-3xl font-bold mb-6 text-blue-300">
            <span className="text-blue-600">Z</span> The Community Board
            </h1>

            <button
            onClick={onShowProfile}
            className="mb-6 mr-4 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-bold"
            >
            View Profile
            </button>

            <button
            onClick={onLogout}
            className="mb-6 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold"
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
                onClick={handlePost}
                className="bg-orange-600 hover:bg-orange-800 px-6 py-2 rounded-lg font-bold"
                >
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
                formatTime={formatTime}
                />
            ))}
            </div>
        </div>
        </div>
    );
}

export default Feed;