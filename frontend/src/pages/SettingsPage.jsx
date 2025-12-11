import React, { useState, useEffect, useContext } from 'react';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import { getTranslation } from '../utils/translations';

// Icons
import { FiMoreVertical, FiEdit2, FiLock, FiPlus, FiUser, FiPhone, FiMail } from 'react-icons/fi';

const SettingsPage = () => {
    const { user, login } = useContext(AuthContext); // Re-using login to update user state locally if needed, or better expose setUser 
    // Actually AuthContext doesn't expose setUser directly. But login updates it. 
    // We can just rely on user refetch or manual update. 
    // Wait, AuthContext has fetchUser but not exposed.
    // I will use api call to update DB, and then refresh page or if AuthContext exposes a refresh way.
    // For now, I will just trust the backend update and maybe force a reload or if I can access setUser via a prop (I can't without modifying AuthContext).
    // Let's assume user object in context needs to be updated.

    // I will modify AuthContext to expose fetchUser or setUser. 
    // But first, let's implement the UI.

    const [activeTab, setActiveTab] = useState('PRICING'); // PRICING, GENERAL, USERS, ROLES
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // General Settings State
    const [language, setLanguage] = useState(user?.language || 'en');

    // ... existing ...

    // Pricing State
    const [settings, setSettings] = useState({
        hourlyRate: 500,
        halfDayPrice: 2500,
        fullDayPrice: 5500
    });

    // Users State
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false); // Create/Edit
    const [showRoleModal, setShowRoleModal] = useState(false); // Role Creation (New)
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Forms
    const [userForm, setUserForm] = useState({ name: '', surname: '', email: '', mobile: '', role: '' });
    const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] }); // Role Form
    const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        fetchSettings();
        fetchUsersAndRoles();
    }, []);

    // ... existing fetchSettings ...
    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings/pricing');
            if (res.data.success) {
                const data = res.data.data;
                setSettings({
                    hourlyRate: data.hourlyRate,
                    halfDayPrice: data.halfDay?.price || 2500,
                    fullDayPrice: data.fullDay?.price || 5500
                });
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchUsersAndRoles = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/auth/users'),
                api.get('/roles')
            ]);
            setUsers(usersRes.data.data);
            setRoles(rolesRes.data.data);
        } catch (err) {
            console.error("Failed to fetch users/roles", err);
        }
    };

    // ... existing pricing handlers ...
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                hourlyRate: Number(settings.hourlyRate),
                halfDayPrice: Number(settings.halfDayPrice),
                fullDayPrice: Number(settings.fullDayPrice)
            };
            await api.put('/settings/pricing', payload);
            setSuccessMsg("Settings updated successfully!");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { setError("Failed to save."); }
        setSaving(false);
    };

    // User Handlers
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                // Update
                await api.put(`/auth/users/${selectedUser._id}`, userForm);
                setSuccessMsg("User updated!");
            } else {
                // Create
                await api.post('/auth/users', { ...userForm, password: 'password123' }); // Default pwd
                setSuccessMsg("User created! Default password: password123");
            }
            setShowUserModal(false);
            fetchUsersAndRoles();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert('Operation failed'); }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/roles', roleForm);
            setSuccessMsg("Role created successfully!");
            setShowRoleModal(false);
            setRoleForm({ name: '', description: '', permissions: [] });
            fetchUsersAndRoles(); // Refresh roles list for user creation
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to create role. Name might be duplicate.');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.password !== passwordForm.confirmPassword) return alert("Passwords do not match");
        try {
            await api.put(`/auth/users/${selectedUser._id}/password`, { password: passwordForm.password });
            setSuccessMsg("Password updated!");
            setShowPasswordModal(false);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert('Failed to update password'); }
    };

    const deleteRole = async (id) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            await api.delete(`/roles/${id}`);
            setSuccessMsg("Role deleted.");
            fetchUsersAndRoles();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) { alert('Failed to delete role. It might be in use.'); }
    };

    const openCreateModal = () => {
        setSelectedUser(null);
        setUserForm({ name: '', surname: '', email: '', mobile: '', role: '' });
        setShowUserModal(true);
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setUserForm({
            name: user.name,
            surname: user.surname || '',
            email: user.email,
            mobile: user.mobile || '',
            role: user.role?._id || ''
        });
        setShowUserModal(true);
        setActiveMenuId(null);
    };

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        setPasswordForm({ password: '', confirmPassword: '' });
        setShowPasswordModal(true);
        setActiveMenuId(null);
    };

    const openDetailsModal = (user) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
    };

    return (
        <LayoutShell title="Settings">
            <div className="max-w-6xl mx-auto space-y-6 relative min-h-screen pb-20">
                {/* Tabs */}
                <div className="flex gap-6 border-b border-gray-100 overflow-x-auto custom-scrollbar pb-1">
                    {['PRICING', 'USERS', 'ROLES', 'GENERAL'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab === 'PRICING' ? 'Pricing Configuration' : tab === 'USERS' ? 'User Management' : tab === 'ROLES' ? 'Role Management' : 'General'}
                            {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-t-full"></span>}
                        </button>
                    ))}
                </div>

                {/* Notifications */}
                {successMsg && <div className="fixed top-24 right-8 bg-black text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce-in">{successMsg}</div>}

                {/* Pricing Content */}
                {activeTab === 'PRICING' && (
                    <Card>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Pricing Rates</h3>
                                <p className="text-gray-400 text-sm mt-1">Configure base rates for bookings.</p>
                            </div>
                        </div>
                        {/* Reuse existing pricing form logic here... simplified for brevity in this replace, ensuring logic remains */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="col-span-full md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hourly Rate (₹)</label>
                                    <input type="number" name="hourlyRate" value={settings.hourlyRate} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold" />
                                </div>
                                <div className="col-span-full space-y-4">
                                    <h4 className="font-bold border-b pb-2">Packages</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Half Day (5h)</label>
                                            <input type="number" name="halfDayPrice" value={settings.halfDayPrice} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Full Day (11h)</label>
                                            <input type="number" name="fullDayPrice" value={settings.fullDayPrice} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <button type="submit" className="bg-[#8F1E22] text-white px-6 py-3 rounded-xl font-bold hover:opacity-80">Save Pricing</button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Users Content */}
                {activeTab === 'USERS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">System Users</h2>
                            <button onClick={openCreateModal} className="bg-yellow-400 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-400/20">
                                <FiPlus /> Create User
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {users.map(user => (
                                <div key={user._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow relative">
                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => openDetailsModal(user)}>
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{user.name} {user.surname}</h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">{user.role?.name || 'No Role'}</span>
                                                <span>{user.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveMenuId(activeMenuId === user._id ? null : user._id)}
                                            className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors"
                                        >
                                            <FiMoreVertical className="text-gray-400" />
                                        </button>

                                        {activeMenuId === user._id && (
                                            <div className="absolute right-0 top-12 w-48 bg-white shadow-xl rounded-xl border border-gray-100 p-1 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <button onClick={() => openEditModal(user)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                                                    <FiEdit2 /> Edit Details
                                                </button>
                                                <button onClick={() => openPasswordModal(user)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                                                    <FiLock /> Update Password
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Roles Content */}
                {activeTab === 'ROLES' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Role Management</h2>
                            <button onClick={() => setShowRoleModal(true)} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-80 transition-colors shadow-lg">
                                <FiLock /> Create Role
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roles.map(role => (
                                <div key={role._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                                    {role.isSystem && <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-3 py-1 rounded-bl-xl text-black">SYSTEM</div>}
                                    <h3 className="font-bold text-xl mb-1">{role.name}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">{role.description || 'No description provided.'}</p>

                                    <div className="border-t border-gray-50 pt-4 flex justify-between items-center">
                                        <div className="text-xs font-bold text-gray-500 uppercase">
                                            {role.permissions?.length || 0} Permissions
                                        </div>
                                        {!role.isSystem && (
                                            <div className="flex gap-2">
                                                <button onClick={() => deleteRole(role._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-xs font-bold transition-colors">Delete</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* General Content */}
                {activeTab === 'GENERAL' && (
                    <Card>
                        <h3 className="text-xl font-bold mb-6">General Settings</h3>

                        <div className="max-w-md">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Application Language</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold"
                            >
                                <option value="en">English (English)</option>
                                <option value="hi">Hindi (हिंदी)</option>
                                <option value="gu">Gujarati (ગુજરાતી)</option>
                                <option value="mr">Marathi (मराठी)</option>
                            </select>

                            <div className="mt-8">
                                <button
                                    onClick={async () => {
                                        setSaving(true);
                                        try {
                                            await api.put('/auth/me', { language });
                                            setSuccessMsg('Language updated successfully! Translating...');

                                            // Trigger Google Translate logic
                                            // We set the cookie 'googtrans' to /en/[target_lang]
                                            // The source is English ('en'). Target is 'language'.
                                            // Format: /source/target or /auto/target.
                                            // Since our app is english, /en/target is safer.
                                            const targetLang = language;
                                            document.cookie = `googtrans=/en/${targetLang}; path=/; domain=${window.location.hostname}`;
                                            document.cookie = `googtrans=/en/${targetLang}; path=/`; // Fallback for localhost

                                            setTimeout(() => window.location.reload(), 1000);
                                        } catch (err) {
                                            console.error(err);
                                            alert("Failed to update language");
                                        }
                                        setSaving(false);
                                    }}
                                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:opacity-80 transition-opacity"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Modals */}

                {/* 1. Create/Edit User Modal */}
                {showUserModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
                            <h3 className="text-2xl font-black mb-6">{selectedUser ? 'Edit User' : 'Create New User'}</h3>
                            <form onSubmit={handleUserSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="First Name" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" required />
                                    <input placeholder="Surname" value={userForm.surname} onChange={e => setUserForm({ ...userForm, surname: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" />
                                </div>
                                <input placeholder="Email" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" required />
                                <input placeholder="Mobile" value={userForm.mobile} onChange={e => setUserForm({ ...userForm, mobile: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" />

                                <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" required>
                                    <option value="">Select Role</option>
                                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowUserModal(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Cancel</button>
                                    <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">{selectedUser ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 2. Password Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
                            <h3 className="text-2xl font-black mb-6">Update Password</h3>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <input type="password" placeholder="New Password" value={passwordForm.password} onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" required />
                                <input type="password" placeholder="Confirm Password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" required />
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowPasswordModal(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Cancel</button>
                                    <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Update</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. Details Modal */}
                {showDetailsModal && selectedUser && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-0 overflow-hidden animate-in zoom-in-95">
                            <div className="bg-yellow-400 p-8 text-center">
                                <div className="w-24 h-24 bg-[#8F1E22] text-white rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white shadow-lg">
                                    {selectedUser.name[0]}
                                </div>
                                <h3 className="text-2xl font-black text-black">{selectedUser.name} {selectedUser.surname}</h3>
                                <p className="font-bold text-black/60">{selectedUser.role?.name}</p>
                            </div>
                            <div className="p-8 space-y-4">
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><FiMail /></div>
                                    <div><span className="block text-xs font-bold text-gray-400 uppercase">Email</span><span className="font-bold text-gray-800">{selectedUser.email}</span></div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><FiPhone /></div>
                                    <div><span className="block text-xs font-bold text-gray-400 uppercase">Mobile</span><span className="font-bold text-gray-800">{selectedUser.mobile || 'N/A'}</span></div>
                                </div>

                                <button onClick={() => setShowDetailsModal(false)} className="w-full py-4 font-bold text-gray-500 hover:text-black">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Create Role Modal */}
                {showRoleModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
                            <h3 className="text-2xl font-black mb-6">Create New Role</h3>
                            <form onSubmit={handleRoleSubmit} className="space-y-4">
                                <input placeholder="Role Name (e.g., Manager)" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" required />
                                <input placeholder="Description" value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold w-full" />

                                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                    <h4 className="font-bold text-sm text-gray-500 uppercase">Permissions</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'MODULE_DASHBOARD', label: 'Dashboard Access' },
                                            { id: 'MODULE_BOOKINGS', label: 'Manage Bookings' },
                                            { id: 'MODULE_EXPENSES', label: 'Manage Expenses' },
                                            { id: 'MODULE_FINANCE', label: 'View Finance' },
                                            { id: 'MODULE_SETTINGS', label: 'Access Settings' },
                                            { id: 'ACTION_MANAGE_USERS', label: 'Manage Users' },
                                            { id: 'ACTION_MANAGE_ROLES', label: 'Manage Roles' }
                                        ].map(perm => (
                                            <label key={perm.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    value={perm.id}
                                                    checked={roleForm.permissions.includes(perm.id)}
                                                    onChange={(e) => {
                                                        const p = roleForm.permissions;
                                                        if (e.target.checked) setRoleForm({ ...roleForm, permissions: [...p, perm.id] });
                                                        else setRoleForm({ ...roleForm, permissions: p.filter(id => id !== perm.id) });
                                                    }}
                                                    className="w-5 h-5 rounded text-black focus:ring-black border-gray-300"
                                                />
                                                <span className="font-bold text-sm">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowRoleModal(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Cancel</button>
                                    <button type="submit" className="bg-[#8F1E22] text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Create Role</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </LayoutShell>
    );
};

export default SettingsPage;
