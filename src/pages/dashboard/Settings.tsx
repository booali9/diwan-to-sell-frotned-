import { useEffect, useState } from 'react'
import Layout from '../../components/Layout/Layout'
import { ShieldCheck, Smartphone, Mail, Lock, Wallet, Monitor, Trash2, X, Activity, AlertTriangle } from 'lucide-react'
import { getProfile, changePassword, changeEmail, deleteAccountService, updateUserProfile, logoutUser } from '../../services/userService'
import { useNavigate } from 'react-router-dom'
import '../../styles/settings.css'

export default function Settings() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState<any>(null)
    const [modal, setModal] = useState<'none' | 'password' | 'email' | 'phone' | 'delete' | 'device' | 'activity'>('none')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState<Record<string, string>>({})

    useEffect(() => {
        getProfile().then(setProfile).catch(() => {})
    }, [])

    const userPhone = profile?.phone || 'Not set'
    const userEmail = profile?.email || '...'

    const closeModal = () => { setModal('none'); setError(''); setSuccess(''); setForm({}); }

    const handleChangePassword = async () => {
        setError(''); setSuccess(''); setLoading(true)
        try {
            if (!form.currentPassword || !form.newPassword) throw new Error('All fields are required')
            if (form.newPassword !== form.confirmPassword) throw new Error('Passwords do not match')
            if (form.newPassword.length < 6) throw new Error('Password must be at least 6 characters')
            await changePassword(form.currentPassword, form.newPassword)
            setSuccess('Password changed successfully')
            setTimeout(closeModal, 1500)
        } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }

    const handleChangeEmail = async () => {
        setError(''); setSuccess(''); setLoading(true)
        try {
            if (!form.newEmail || !form.password) throw new Error('All fields are required')
            await changeEmail(form.newEmail, form.password)
            setSuccess('Email changed successfully')
            getProfile().then(setProfile).catch(() => {})
            setTimeout(closeModal, 1500)
        } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }

    const handleBindPhone = async () => {
        setError(''); setSuccess(''); setLoading(true)
        try {
            if (!form.phone) throw new Error('Phone number is required')
            await updateUserProfile({ phone: form.phone })
            setSuccess('Phone updated successfully')
            getProfile().then(setProfile).catch(() => {})
            setTimeout(closeModal, 1500)
        } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }

    const handleDeleteAccount = async () => {
        setError(''); setSuccess(''); setLoading(true)
        try {
            if (!form.password) throw new Error('Password is required')
            if (form.confirmDelete !== 'DELETE') throw new Error('Type DELETE to confirm')
            await deleteAccountService(form.password)
            logoutUser()
            navigate('/login')
        } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }

    return (
        <Layout activePage="settings">
            <div className="settings-page-container">
                <div className="settings-section">
                    <h2 className="section-title">Authentication method</h2>
                    <div className="settings-card">
                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <ShieldCheck size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Google Authenticator</div>
                                <div className="setting-description">API Secure verification when withdrawing, retrieving passwords, modifying security settings and managing API</div>
                            </div>
                            <div className="setting-action">
                                <button className="setting-btn secondary">Bind</button>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Smartphone size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Phone number</div>
                                <div className="setting-description">Receive verification SMS that is used to withdraw, change the password or security settings</div>
                            </div>
                            <div className="setting-value">{userPhone}</div>
                            <div className="setting-action">
                                <button className="setting-btn secondary" onClick={() => { setForm({ phone: '' }); setModal('phone'); }}>{userPhone !== 'Not set' ? 'Change' : 'Bind'}</button>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Mail size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Email address</div>
                                <div className="setting-description">Used when logging in, withdrawing and modifying security settings</div>
                            </div>
                            <div className="setting-value">{userEmail}</div>
                            <div className="setting-action">
                                <button className="setting-btn primary" onClick={() => { setForm({ newEmail: '', password: '' }); setModal('email'); }}>Change</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2 className="section-title">Advanced Security</h2>
                    <div className="settings-card">
                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Lock size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Password</div>
                                <div className="setting-description">Used to manage your account login password</div>
                            </div>
                            <div className="setting-action">
                                <button className="setting-btn primary" onClick={() => { setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setModal('password'); }}>Change</button>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Wallet size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Address management</div>
                                <div className="setting-description">After setting as a trust address, withdrawals will be exempt from security verification</div>
                            </div>
                            <div className="setting-action">
                                <button className="setting-btn secondary" onClick={() => navigate('/dashboard/deposit')}>Manage</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2 className="section-title">Account Management</h2>
                    <div className="settings-card">
                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Monitor size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">My device</div>
                                <div className="setting-description">For managing logged-in devices and viewing device history</div>
                            </div>
                            <div className="setting-action">
                                <button className="setting-btn secondary" onClick={() => setModal('device')}>Manage</button>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Activity size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Account activity</div>
                                <div className="setting-description">Last login: {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</div>
                            </div>
                            <div className="setting-action">
                                <button className="setting-btn secondary" onClick={() => setModal('activity')}>Manage</button>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Trash2 size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Delete account</div>
                                <div className="setting-description">After deleting your account, you will never be able to re-register this account and its sub-account email, mobile phone number, and identity information.</div>
                            </div>
                            <div className="setting-action">
                                <button className="setting-btn secondary" onClick={() => { setForm({ password: '', confirmDelete: '' }); setModal('delete'); }}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Modals */}
            {modal !== 'none' && (
                <div className="settings-modal-overlay" onClick={closeModal}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <button className="settings-modal-close" onClick={closeModal}><X size={18} /></button>
                        
                        {modal === 'password' && (
                            <>
                                <h3 className="settings-modal-title"><Lock size={18} /> Change Password</h3>
                                <div className="settings-modal-field">
                                    <label>Current Password</label>
                                    <input type="password" placeholder="Enter current password" value={form.currentPassword || ''} onChange={e => setForm(p => ({...p, currentPassword: e.target.value}))} />
                                </div>
                                <div className="settings-modal-field">
                                    <label>New Password</label>
                                    <input type="password" placeholder="Enter new password" value={form.newPassword || ''} onChange={e => setForm(p => ({...p, newPassword: e.target.value}))} />
                                </div>
                                <div className="settings-modal-field">
                                    <label>Confirm New Password</label>
                                    <input type="password" placeholder="Confirm new password" value={form.confirmPassword || ''} onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))} />
                                </div>
                                <button className="settings-modal-submit" disabled={loading} onClick={handleChangePassword}>{loading ? 'Saving...' : 'Change Password'}</button>
                            </>
                        )}

                        {modal === 'email' && (
                            <>
                                <h3 className="settings-modal-title"><Mail size={18} /> Change Email</h3>
                                <p className="settings-modal-hint">Current: {userEmail}</p>
                                <div className="settings-modal-field">
                                    <label>New Email</label>
                                    <input type="email" placeholder="Enter new email" value={form.newEmail || ''} onChange={e => setForm(p => ({...p, newEmail: e.target.value}))} />
                                </div>
                                <div className="settings-modal-field">
                                    <label>Password</label>
                                    <input type="password" placeholder="Enter your password" value={form.password || ''} onChange={e => setForm(p => ({...p, password: e.target.value}))} />
                                </div>
                                <button className="settings-modal-submit" disabled={loading} onClick={handleChangeEmail}>{loading ? 'Saving...' : 'Change Email'}</button>
                            </>
                        )}

                        {modal === 'phone' && (
                            <>
                                <h3 className="settings-modal-title"><Smartphone size={18} /> {userPhone !== 'Not set' ? 'Change' : 'Bind'} Phone</h3>
                                {userPhone !== 'Not set' && <p className="settings-modal-hint">Current: {userPhone}</p>}
                                <div className="settings-modal-field">
                                    <label>Phone Number</label>
                                    <input type="tel" placeholder="Enter phone number" value={form.phone || ''} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
                                </div>
                                <button className="settings-modal-submit" disabled={loading} onClick={handleBindPhone}>{loading ? 'Saving...' : 'Save Phone'}</button>
                            </>
                        )}

                        {modal === 'delete' && (
                            <>
                                <h3 className="settings-modal-title" style={{color:'#ef4444'}}><AlertTriangle size={18} /> Delete Account</h3>
                                <p className="settings-modal-hint" style={{color:'#ef4444'}}>This action is permanent and cannot be undone. All your data, including trading history and balances, will be lost.</p>
                                <div className="settings-modal-field">
                                    <label>Password</label>
                                    <input type="password" placeholder="Enter your password" value={form.password || ''} onChange={e => setForm(p => ({...p, password: e.target.value}))} />
                                </div>
                                <div className="settings-modal-field">
                                    <label>Type DELETE to confirm</label>
                                    <input type="text" placeholder="DELETE" value={form.confirmDelete || ''} onChange={e => setForm(p => ({...p, confirmDelete: e.target.value}))} />
                                </div>
                                <button className="settings-modal-submit danger" disabled={loading} onClick={handleDeleteAccount}>{loading ? 'Deleting...' : 'Delete My Account'}</button>
                            </>
                        )}

                        {modal === 'device' && (
                            <>
                                <h3 className="settings-modal-title"><Monitor size={18} /> My Devices</h3>
                                <div className="settings-device-list">
                                    <div className="settings-device-item active">
                                        <Monitor size={20} />
                                        <div>
                                            <span className="settings-device-name">{navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser'}</span>
                                            <span className="settings-device-detail">Current session · {navigator.platform}</span>
                                        </div>
                                        <span className="settings-device-badge">Active</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {modal === 'activity' && (
                            <>
                                <h3 className="settings-modal-title"><Activity size={18} /> Account Activity</h3>
                                <div className="settings-activity-list">
                                    <div className="settings-activity-item">
                                        <span className="settings-activity-action">Login</span>
                                        <span className="settings-activity-time">{profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</span>
                                        <span className="settings-activity-detail">{navigator.platform} · {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</span>
                                    </div>
                                    <div className="settings-activity-item">
                                        <span className="settings-activity-action">Account Created</span>
                                        <span className="settings-activity-time">{profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {error && <p className="settings-modal-error">{error}</p>}
                        {success && <p className="settings-modal-success">{success}</p>}
                    </div>
                </div>
            )}
        </Layout>
    )
}
