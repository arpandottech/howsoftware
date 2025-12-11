import React, { useState, useEffect, useContext } from 'react';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';

const ProfilePage = () => {
    const { user } = useContext(AuthContext); // user from context might need refresh if permissions change
    const [profileData, setProfileData] = useState(null);
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });
    const [newUser, setNewUser] = useState({ name: '', surname: '', email: '', mobile: '', password: '', role: '' });

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', surname: '', mobile: '' });

    // UI Toggles
    const [activeTab, setActiveTab] = useState('INFO'); // INFO, ROLES, USERS

    const permissionsList = [
        'MODULE_DASHBOARD',
        'MODULE_BOOKINGS',
        'MODULE_EXPENSES',
        'MODULE_FINANCE',
        'MODULE_SETTINGS',
        'ACTION_MANAGE_USERS',
        'ACTION_MANAGE_ROLES'
    ];

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/me');
            if (res.data.success) {
                setProfileData(res.data.data);
                // Initialize edit data
                setEditData({
                    name: res.data.data.name || '',
                    surname: res.data.data.surname || '',
                    mobile: res.data.data.mobile || ''
                });
            }

            // If Admin, fetch roles and users
            // We check local user object or fetched profile. 
            // Better to check fetched profile role name/permissions.
            const isAdmin = res.data.data.role && res.data.data.role.permissions && res.data.data.role.permissions.includes('ACTION_MANAGE_ROLES');
            // Or simple check for now:
            const isSimpleAdmin = res.data.data.role && res.data.data.role.name === 'Admin';

            if (isAdmin || isSimpleAdmin) {
                fetchAdminData();
            }

        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        try {
            const rolesRes = await api.get('/roles');
            setRoles(rolesRes.data.data);

            const usersRes = await api.get('/auth/users');
            setUsers(usersRes.data.data);
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    // Handlers
    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            await api.post('/roles', newRole);
            setNewRole({ name: '', description: '', permissions: [] });
            fetchAdminData(); // Refresh
            alert('Role Created!');
        } catch (err) {
            alert('Failed to create role');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/users', newUser);
            setNewUser({ name: '', surname: '', email: '', mobile: '', password: '', role: '' });
            fetchAdminData();
            alert('User Created!');
        } catch (err) {
            alert('Failed to create user');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/auth/me', editData);
            if (res.data.success) {
                setProfileData(res.data.data);
                setIsEditing(false);
                alert('Profile Updated Successfully');
            }
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    const togglePermission = (perm) => {
        setNewRole(prev => {
            if (prev.permissions.includes(perm)) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== perm) };
            } else {
                return { ...prev, permissions: [...prev.permissions, perm] };
            }
        });
    };

    if (loading) return <LayoutShell><div className="p-8">Loading...</div></LayoutShell>;

    const isAdmin = profileData?.role?.name === 'Admin' || (profileData?.role?.permissions && profileData.role.permissions.includes('ACTION_MANAGE_ROLES'));

    return (
        <LayoutShell title="Profile">
            <div className="space-y-8 max-w-6xl mx-auto">

                {/* Header Profile Card */}
                <div className="bg-[#8F1E22] text-white rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="w-32 h-32 rounded-full border-4 border-yellow-400 p-1 relative z-10 bg-[#8F1E22]">
                        <img
                            src={profileData?.profilePic || `https://ui-avatars.com/api/?name=${profileData?.name}+${profileData?.surname}&background=F7D154&color=000`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>

                    <div className="text-center md:text-left z-10 flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <h2 className="text-3xl font-black">{profileData?.name} {profileData?.surname}</h2>
                            <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full uppercase tracking-wider">
                                {profileData?.role?.name || 'Staff'}
                            </span>
                        </div>
                        <p className="text-gray-400 font-medium mb-4">{profileData?.email}</p>
                        <div className="flex justify-center md:justify-start gap-6 text-sm font-bold text-gray-300">
                            <div>
                                <span className="block text-xs text-gray-500 uppercase">Mobile</span>
                                {profileData?.mobile || 'N/A'}
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500 uppercase">Joined</span>
                                {new Date().getFullYear()} {/* Mock for now */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 border-b border-gray-200 pb-1">
                    <button
                        onClick={() => setActiveTab('INFO')}
                        className={`pb-3 px-2 font-bold transition-all ${activeTab === 'INFO' ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        My Info
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => setActiveTab('ROLES')}
                                className={`pb-3 px-2 font-bold transition-all ${activeTab === 'ROLES' ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Role Management
                            </button>
                            <button
                                onClick={() => setActiveTab('USERS')}
                                className={`pb-3 px-2 font-bold transition-all ${activeTab === 'USERS' ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                User Management
                            </button>
                        </>
                    )}
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {activeTab === 'INFO' && (
                        <Card>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Personal Details</h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                >
                                    {isEditing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">First Name</label>
                                            <input
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Surname</label>
                                            <input
                                                value={editData.surname}
                                                onChange={(e) => setEditData({ ...editData, surname: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mobile Number</label>
                                            <input
                                                value={editData.mobile}
                                                onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 shadow-lg"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</span>
                                        <div className="text-lg font-bold text-gray-900">{profileData?.name} {profileData?.surname}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</span>
                                        <div className="text-lg font-bold text-gray-900">{profileData?.email}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Mobile Number</span>
                                        <div className="text-lg font-bold text-gray-900">{profileData?.mobile || 'Not Set'}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Role</span>
                                        <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            {profileData?.role?.name || 'Staff'}
                                            {profileData?.role?.isSystem && <span className="bg-yellow-400 text-black text-[10px] px-2 rounded-full">SYSTEM</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {activeTab === 'ROLES' && isAdmin && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Create Role */}
                            <Card>
                                <h3 className="text-xl font-bold mb-6">Create New Role</h3>
                                <form onSubmit={handleCreateRole} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role Name</label>
                                        <input
                                            value={newRole.name}
                                            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-black"
                                            placeholder="e.g. Reception"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                                        <input
                                            value={newRole.description}
                                            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-black"
                                            placeholder="Description..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Permissions (Check Modules)</label>
                                        <div className="grid grid-cols-1 gap-2 border border-gray-100 p-3 rounded-xl bg-gray-50">
                                            {permissionsList.map(perm => (
                                                <label key={perm} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-white rounded-lg transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={newRole.permissions.includes(perm)}
                                                        onChange={() => togglePermission(perm)}
                                                        className="w-4 h-4 text-black rounded focus:ring-black"
                                                    />
                                                    <span className="text-sm font-bold text-gray-700 capitalize">
                                                        {perm.replace('MODULE_', '').replace('ACTION_', '').replace('_', ' ')}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
                                        Create Role
                                    </button>
                                </form>
                            </Card>

                            {/* List Roles */}
                            <Card>
                                <h3 className="text-xl font-bold mb-6">Existing Roles</h3>
                                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                    {roles.map(role => (
                                        <div key={role._id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all bg-white group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-lg">{role.name}</h4>
                                                {role.isSystem ? (
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">System</span>
                                                ) : (
                                                    <button className="text-red-500 text-xs font-bold hover:underline">Delete</button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3">{role.description || 'No description'}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions.map(p => (
                                                    <span key={p} className="bg-yellow-50 text-yellow-700 text-[10px] px-2 py-0.5 rounded font-bold border border-yellow-100">
                                                        {p.replace('MODULE_', '').replace('ACTION_', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'USERS' && isAdmin && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Create User */}
                            <div className="lg:col-span-1">
                                <Card>
                                    <h3 className="text-xl font-bold mb-6">Add New User</h3>
                                    <form onSubmit={handleCreateUser} className="space-y-4">
                                        <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="First Name" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-black" />
                                        <input value={newUser.surname} onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })} placeholder="Surname" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-black" />
                                        <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-black" />
                                        <input value={newUser.mobile} onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })} placeholder="Mobile Number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-black" />
                                        <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-black" />

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Assign Role</label>
                                            <select
                                                value={newUser.role}
                                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                                required
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-black"
                                            >
                                                <option value="">Select a Role</option>
                                                {roles.map(r => (
                                                    <option key={r._id} value={r._id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button type="submit" className="w-full bg-[#8F1E22] text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors mt-2">
                                            Create User
                                        </button>
                                    </form>
                                </Card>
                            </div>

                            {/* User List */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <h3 className="text-xl font-bold mb-6">System Users</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                                    <th className="pb-3 pl-2">User</th>
                                                    <th className="pb-3">Role</th>
                                                    <th className="pb-3">Mobile</th>
                                                    <th className="pb-3 pr-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-gray-800">
                                                {users.map(u => (
                                                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 pl-2 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xs">
                                                                {u.name[0]}{u.surname ? u.surname[0] : ''}
                                                            </div>
                                                            <div>
                                                                <div className="text-black">{u.name} {u.surname}</div>
                                                                <div className="text-xs text-gray-400 font-medium">{u.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                                {u.role ? u.role.name : 'No Role'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-gray-500">{u.mobile || '-'}</td>
                                                        <td className="py-4 pr-2 text-right">
                                                            <button className="text-gray-400 hover:text-black transition-colors">
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </LayoutShell>
    );
};

export default ProfilePage;
