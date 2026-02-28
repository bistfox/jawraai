// app/image-gen/page.tsx
'use client';

import { useState } from 'react';

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('প্রম্পট লিখ রে গান্ডু! 😈');
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'কিছু একটা ভুল হয়েছে রে!');
      }

      setImageUrl(data.imageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', background: '#111', borderRadius: '15px', border: '2px solid #ff0066', color: 'white' }}>
      <h1 style={{ textAlign: 'center', color: '#ff0066' }}>🔥 Advance Uncensored NSFW Generator 🔥</h1>
      <p style={{ textAlign: 'center' }}>যত নোংরা প্রম্পট দিবি, ততই খারাপ ইমেজ আসবে 😈</p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="এখানে নোংরা প্রম্পট লিখ... e.g. a girl getting double penetrated with cum dripping from pussy and ass..."
        rows={5}
        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ff0066', background: '#222', color: 'white', fontSize: '16px' }}
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          background: loading ? '#555' : '#ff0066',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          fontSize: '20px',
          borderRadius: '50px',
          cursor: loading ? 'not-allowed' : 'pointer',
          margin: '20px auto',
          display: 'block',
          boxShadow: '0 0 15px #ff0066',
        }}
      >
        {loading ? 'Generating... wait রে মাগি 💦' : 'Generate NSFW Image 😈'}
      </button>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {imageUrl && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <img src={imageUrl} alt="Generated NSFW Image" style={{ maxWidth: '100%', borderRadius: '10px', border: '2px solid #ff0066' }} />
        </div>
      )}
    </div>
  );
}
