import { useState } from 'react';

function Register({ onRegister, onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handleSubmit = async () => {
        const result = await onRegister(username, password);
        if (result.error) {
        setMessage(result.error.message);
        setMessageType('error');
        } else {
        setMessage("Account Created! Login now.");
        setMessageType('success');
        setTimeout(() => onSwitchToLogin(), 2000);
        }
        setTimeout(() => setMessage(''), 4000);
    };

    return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        
        <h1 className="text-5xl font-bold text-blue-300 pb-10">
            <span className="text-blue-600">Z</span> Community Board
        </h1>

        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
            <h1 className="text-3xl font-bold mb-8 text-center text-blue-200">
                <span className="text-blue-600">Z</span> Register</h1>            {message && (
            <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {message}
            </div>
            )}
            <div className="space-y-4">
            <input
                type="text"
                placeholder="Username"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold"
            >
                Create Account
            </button>
            <button
                onClick={onSwitchToLogin}
                className="w-full text-blue-400 text-sm hover:underline"
            >
                Already have an account? Login
            </button>
            </div>
        </div>
    </div>
    );
    }

export default Register;