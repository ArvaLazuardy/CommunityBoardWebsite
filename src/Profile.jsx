import { useState, useEffect } from 'react';

function Profile({ session, username, onBack, supabase }) {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
    }, []);

    async function fetchProfile() {
        setLoading(true);
        const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

        if (data) {
        setProfile(data);
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        }
        setLoading(false);
    }

    async function fetchUserPosts() {
        const { data } = await supabase
        .from('posts')
        .select('*, reactions(vote_type)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

        const formattedPosts = data?.map(post => ({
        ...post,
        likes: post.reactions.filter(r => r.vote_type === 'like').length,
        dislikes: post.reactions.filter(r => r.vote_type === 'dislike').length,
        })) || [];

        setUserPosts(formattedPosts);
    }

    async function updateProfile() {
        const { error } = await supabase
        .from('profiles')
        .update({
            bio: bio,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

        if (!error) {
        setIsEditing(false);
        fetchProfile();
        }
    }

    if (loading) {
        return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <p className="text-gray-400">Loading profile...</p>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
            <button
                onClick={onBack}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
            >
                <span>←</span>
                <span>Back to Feed</span>
            </button>
            </div>

            {/* Profile Card */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 mb-8">
            <div className="flex items-start space-x-6">
                {/* Avatar */}
                <div className="shrink-0">
                {avatarUrl ? (
                    <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold">
                    {username?.charAt(0).toUpperCase()}
                    </div>
                )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                <h1 className="text-3xl font-bold text-blue-400 mb-2">{username}</h1>
                
                {!isEditing ? (
                    <>
                    <p className="text-gray-300 mb-4">
                        {profile?.bio || 'No bio yet. Tell us about yourself!'}
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold"
                    >
                        Edit Profile
                    </button>
                    </>
                ) : (
                    <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Bio</label>
                        <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-blue-500 resize-none"
                        rows="3"
                        placeholder="Tell us about yourself..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Avatar URL</label>
                        <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                        placeholder="https://example.com/avatar.jpg"
                        />
                    </div>
                    <div className="flex space-x-3">
                        <button
                        onClick={updateProfile}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold"
                        >
                        Save Changes
                        </button>
                        <button
                        onClick={() => {
                            setIsEditing(false);
                            setBio(profile?.bio || '');
                            setAvatarUrl(profile?.avatar_url || '');
                        }}
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-bold"
                        >
                        Cancel
                        </button>
                    </div>
                    </div>
                )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-700">
                <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{userPosts.length}</p>
                <p className="text-sm text-gray-400">Posts</p>
                </div>
                <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                    {userPosts.reduce((sum, post) => sum + post.likes, 0)}
                </p>
                <p className="text-sm text-gray-400">Total Likes</p>
                </div>
                <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                    {userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-400">Comments Received</p>
                </div>
            </div>
            </div>

            {/* User's Posts */}
            <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-300">Your Posts</h2>
            {userPosts.length === 0 ? (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                <p className="text-gray-400">You haven't posted anything yet!</p>
                </div>
            ) : (
                <div className="space-y-4">
                {userPosts.map((post) => (
                    <div
                    key={post.id}
                    className="bg-gray-800 rounded-xl border border-gray-700 p-4"
                    >
                    <p className={`text-gray-200 mb-3 ${post.is_deleted ? 'italic text-gray-400' : ''}`}>
                        {post.content}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>👍 {post.likes}</span>
                        <span>👎 {post.dislikes}</span>
                        <span>
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                        </span>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </div>
        </div>
        </div>
    );
}

export default Profile;