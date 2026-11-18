import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Ruler, Weight, Camera, Save, CheckCircle } from 'lucide-react';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    height: '',
    weight: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
          height: data.height || '',
          weight: data.weight || ''
        });
        if (data.profilePicture) {
          setPreviewImage(data.profilePicture);
        }
      } else {
        setError('Failed to load user profile data.');
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
      setError('Network error while loading profile.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      if (formData.password) {
        data.append('password', formData.password);
      }
      data.append('height', formData.height);
      data.append('weight', formData.weight);
      if (profileImage) {
        data.append('profileImage', profileImage);
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Content-Type header intentionally omitted so browser sets multipart/form-data boundary automatically
        },
        body: data
      });

      const result = await res.json();
      if (res.ok) {
        setSuccessMessage('Profile updated successfully!');
        if (result.profilePicture) {
          setPreviewImage(result.profilePicture);
        }
        setFormData(prev => ({ ...prev, password: '' })); // Clear password field after save
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">EDIT PROFILE</h1>
        <p className="text-sm text-slate-400">Update your personal information, credentials, and physical metrics.</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#111622] border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-6 pb-6 border-b border-slate-800">
          <div className="relative w-20 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center text-yellow-400">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={32} />
            )}
            <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-white text-xs">
              <Camera size={18} />
              <span>Change</span>
              <input type="file" accept="image/*" onChange={handleImageCode => handleImageChange(handleImageCode)} className="hidden" />
            </label>
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Profile Picture</h3>
            <p className="text-xs text-slate-400 mt-0.5">Upload a clear photo. JPG, PNG or GIF.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-10 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-10 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-10 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password <span className="text-slate-500 font-normal">(Leave blank to keep current)</span></label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-10 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Height</label>
            <div className="relative">
              <Ruler className="absolute left-3.5 top-3 text-slate-500" size={18} />

<input
  type="text"
  name="height"
  placeholder={'e.g. 5\'11" or 180 cm'}
  value={formData.height}
  onChange={handleChange}
  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Weight</label>
            <div className="relative">
              <Weight className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                name="weight"
                placeholder="e.g. 75 kg"
                value={formData.weight}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-10 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition shadow-lg shadow-yellow-500/20 disabled:opacity-50"
          >
            <Save size={18} />
            <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}