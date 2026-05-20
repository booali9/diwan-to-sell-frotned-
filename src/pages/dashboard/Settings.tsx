import { useEffect, useState } from 'react'
import Layout from '../../components/Layout/Layout'
import { ShieldCheck, Smartphone, Mail, Lock, Wallet, Monitor, Trash2, X, Activity, AlertTriangle, Key, Bell } from 'lucide-react'
import { getProfile, changePassword, changeEmail, deleteAccountService, updateUserProfile, logoutUser, setFundPasswordService } from '../../services/userService'
import { useNavigate } from 'react-router-dom'
import '../../styles/settings.css'

export default function Settings() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState<any>(null)
    const [modal, setModal] = useState<'none' | 'password' | 'email' | 'phone' | 'delete' | 'device' | 'activity' | 'fund-password'>('none')
    const [pendingAction, setPendingAction] = useState<'password' | 'email' | 'phone' | 'fund-password' | null>(null)
    const [confirmLockChecked, setConfirmLockChecked] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState<Record<string, string>>({})
    
    const [notifTrade, setNotifTrade] = useState(true)
    const [notifSystem, setNotifSystem] = useState(true)
    const [notifMarket, setNotifMarket] = useState(true)

    useEffect(() => {
        getProfile().then(p => {
            setProfile(p);
            if (p.notificationPreferences) {
                setNotifTrade(p.notificationPreferences.trade ?? true);
                setNotifSystem(p.notificationPreferences.system ?? true);
                setNotifMarket(p.notificationPreferences.market ?? true);
            }
        }).catch(() => {})
    }, [])

    const userPhone = profile?.phone || 'Not set'
    const userEmail = profile?.email || '...'

    const closeModal = () => { setModal('none'); setError(''); setSuccess(''); setForm({}); setPendingAction(null); setConfirmLockChecked(false); }

    const triggerPushNotification = async () => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Security Alert', { body: 'A change to your security settings has been requested. Withdrawals will be restricted for 24h.' })
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission()
                if (permission === 'granted') {
                    new Notification('Security Alert', { body: 'A change to your security settings has been requested. Withdrawals will be restricted for 24h.' })
                }
            }
        }
    }

    const handleChangePassword = () => {
        setError('');
        try {
            if (!form.currentPassword || !form.newPassword) throw new Error('All fields are required')
            if (form.newPassword !== form.confirmPassword) throw new Error('Passwords do not match')
            if (form.newPassword.length < 6) throw new Error('Password must be at least 6 characters')
            
            triggerPushNotification();
            setPendingAction('password');
        } catch (e: any) { setError(e.message) }
    }

    const executeChangePassword = async () => {
        setError(''); setSuccess(''); setLoading(true)
        try {
            await changePassword(form.currentPassword, form.newPassword)
            setSuccess('Password changed successfully')
            setTimeout(closeModal, 1500)
        } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }

    const handleChangeEmail = () => {
        setError('');
        try {
            if (!form.newEmail || !form.password) throw new Error('All fields are required')
            triggerPushNotification();
            setPendingAction('email');
        } catch (e: any) { setError(e.message) }
    }

    const executeChangeEmail = async () => {
        setError(''); setSuccess(''); setLoading(true)
        try {
            await changeEmail(form.newEmail, form.password)
            setSuccess('Email changed successfully')
            getProfile().then(setProfile).catch(() => {})
            setTimeout(closeModal, 1500)
        } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }

    const handleBindPhone = () => {
        setError('');
        try {
            if (!form.phone) throw new Error('Phone number is required')
            triggerPushNotification();
            setPendingAction('phone');
        } catch (e: any) { setError(e.message) }
    }

    const executeBindPhone = async () => {
        setError(''); setSuccess(''); setLoading(true)
        try {
            await updateUserProfile({ phone: form.phone })
            setSuccess('Phone updated successfully')
            getProfile().then(setProfile).catch(() => {})
            setTimeout(closeModal, 1500)
        } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    }

    const handleSetFundPassword = () => {
        setError('');
        try {
            if (!form.currentPassword || !form.newFundPassword) throw new Error('All fields are required')
            if (form.newFundPassword !== form.confirmFundPassword) throw new Error('Fund Passwords do not match')
            if (form.newFundPassword.length < 6) throw new Error('Fund Password must be at least 6 characters')
            triggerPushNotification();
            setPendingAction('fund-password');
        } catch (e: any) { setError(e.message) }
    }

    const executeSetFundPassword = async () => {
        setError(''); setSuccess(''); setLoading(true)
        try {
            await setFundPasswordService(form.currentPassword, form.newFundPassword)
            setSuccess('Fund password set successfully')
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

    const handleNotificationToggle = async (type: 'trade' | 'system' | 'market', value: boolean) => {
        try {
            if (type === 'trade') setNotifTrade(value);
            if (type === 'system') setNotifSystem(value);
            if (type === 'market') setNotifMarket(value);
            await updateUserProfile({
                notificationPreferences: {
                    trade: type === 'trade' ? value : notifTrade,
                    system: type === 'system' ? value : notifSystem,
                    market: type === 'market' ? value : notifMarket
                }
            });
        } catch (error) {
            console.error(error);
        }
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

                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Key size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Fund Password</div>
                                <div className="setting-description">Used to verify your identity when withdrawing or transferring funds</div>
                            </div>
                            <div className="setting-value" style={{ marginLeft: 'auto', marginRight: '24px', color: '#e4e4e7', fontSize: '14px', fontWeight: 500 }}>{profile?.hasFundPassword ? 'Set' : 'Not set'}</div>
                            <div className="setting-action" style={{ marginLeft: 0 }}>
                                <button className={profile?.hasFundPassword ? "setting-btn secondary" : "setting-btn primary"} onClick={() => { setForm({ currentPassword: '', newFundPassword: '', confirmFundPassword: '' }); setModal('fund-password'); }}>{profile?.hasFundPassword ? 'Change' : 'Set'}</button>
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

                <div className="settings-section">
                    <h2 className="section-title">Notification Settings</h2>
                    <div className="settings-card">
                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Bell size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Trade Alerts</div>
                                <div className="setting-description">Receive notifications for order execution and margin calls</div>
                            </div>
                            <div className="setting-action" style={{ display: 'flex', alignItems: 'center' }}>
                                <div 
                                    onClick={() => handleNotificationToggle('trade', !notifTrade)} 
                                    style={{ width: 44, height: 24, borderRadius: 12, background: notifTrade ? '#1CD4A7' : '#2a2a3a', padding: 2, transition: 'background 0.2s', cursor: 'pointer' }}
                                >
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: notifTrade ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                                </div>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Bell size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">System Alerts</div>
                                <div className="setting-description">Receive notifications for system maintenance and security updates</div>
                            </div>
                            <div className="setting-action" style={{ display: 'flex', alignItems: 'center' }}>
                                <div 
                                    onClick={() => handleNotificationToggle('system', !notifSystem)} 
                                    style={{ width: 44, height: 24, borderRadius: 12, background: notifSystem ? '#1CD4A7' : '#2a2a3a', padding: 2, transition: 'background 0.2s', cursor: 'pointer' }}
                                >
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: notifSystem ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                                </div>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-icon-box">
                                <Bell size={20} className="text-teal-500" />
                            </div>
                            <div className="setting-info">
                                <div className="setting-name">Market Movement Alerts</div>
                                <div className="setting-description">Receive notifications for significant price changes on favorites</div>
                            </div>
                            <div className="setting-action" style={{ display: 'flex', alignItems: 'center' }}>
                                <div 
                                    onClick={() => handleNotificationToggle('market', !notifMarket)} 
                                    style={{ width: 44, height: 24, borderRadius: 12, background: notifMarket ? '#1CD4A7' : '#2a2a3a', padding: 2, transition: 'background 0.2s', cursor: 'pointer' }}
                                >
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: notifMarket ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                                </div>
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
                        
                        {pendingAction ? (
                            <div className="security-freeze-panel">
                                <h3 className="settings-modal-title" style={{color:'#ef4444', marginBottom: '8px'}}><AlertTriangle size={18} /> Security Freeze Confirmation</h3>
                                <p className="settings-modal-hint" style={{fontSize: '14px', lineHeight: '1.5'}}>You are about to change a critical security setting. To protect your funds from unauthorized access, this action will freeze all withdrawals and internal transfers for 24 hours.</p>
                                
                                <label className="freeze-checkbox-container" style={{display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '20px', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)'}}>
                                    <input type="checkbox" checked={confirmLockChecked} onChange={(e) => setConfirmLockChecked(e.target.checked)} style={{marginTop: '4px', width: '16px', height: '16px', accentColor: '#ef4444'}} />
                                    <span style={{fontSize: '14px', color: '#e4e4e7', lineHeight: '1.4'}}>I understand and confirm that completing this change will freeze my withdrawals and internal transfers for 24 hours.</span>
                                </label>

                                <button 
                                    className="settings-modal-submit danger" 
                                    style={{marginTop: '24px'}}
                                    disabled={!confirmLockChecked || loading} 
                                    onClick={() => {
                                        if (pendingAction === 'password') executeChangePassword()
                                        else if (pendingAction === 'email') executeChangeEmail()
                                        else if (pendingAction === 'phone') executeBindPhone()
                                        else if (pendingAction === 'fund-password') executeSetFundPassword()
                                    }}
                                >
                                    {loading ? 'Processing...' : 'Confirm Change & Apply Freeze'}
                                </button>
                                <button 
                                    className="settings-modal-submit secondary" 
                                    style={{marginTop: '12px', background: 'transparent', color: '#71717A', border: '1px solid #27273A'}}
                                    onClick={() => setPendingAction(null)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
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

                        {modal === 'fund-password' && (
                            <>
                                <h3 className="settings-modal-title"><Key size={18} /> {profile?.hasFundPassword ? 'Change' : 'Set'} Fund Password</h3>
                                <div className="settings-modal-field">
                                    <label>Login Password</label>
                                    <input type="password" placeholder="Enter login password" value={form.currentPassword || ''} onChange={e => setForm(p => ({...p, currentPassword: e.target.value}))} />
                                </div>
                                <div className="settings-modal-field">
                                    <label>New Fund Password</label>
                                    <input type="password" placeholder="Enter new fund password" value={form.newFundPassword || ''} onChange={e => setForm(p => ({...p, newFundPassword: e.target.value}))} />
                                </div>
                                <div className="settings-modal-field">
                                    <label>Confirm Fund Password</label>
                                    <input type="password" placeholder="Confirm new fund password" value={form.confirmFundPassword || ''} onChange={e => setForm(p => ({...p, confirmFundPassword: e.target.value}))} />
                                </div>
                                <button className="settings-modal-submit" disabled={loading} onClick={handleSetFundPassword}>{loading ? 'Saving...' : 'Save Fund Password'}</button>
                            </>
                        )}

                        {error && <p className="settings-modal-error">{error}</p>}
                        {success && <p className="settings-modal-success">{success}</p>}
                            </>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    )
}
