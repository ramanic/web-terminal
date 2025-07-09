import React, { useState } from "react";

interface Props {
  onSubmit: (passkey: string | null) => void;
  error: string | null;
}

const LoginScreen: React.FC<Props> = ({ onSubmit, error }) => {
  const [passkey, setPasskey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(passkey.trim() || null);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="w-80 p-6 border border-gray-700 bg-black rounded space-y-4"
      >
        <h2 className="text-lg font-semibold">Enter Password</h2>
        <input
          type="password"
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 bg-black border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white"
        />
        <button
          type="submit"
          className="w-full py-2 bg-white text-black font-semibold hover:bg-gray-200"
        >
          Connect
        </button>
        {error && <p className="text-red-500 mb-4">{error}</p>}
      </form>
    </div>
  );
};

export default LoginScreen;
