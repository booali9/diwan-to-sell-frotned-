import { useState, useEffect } from 'react'
import { ArrowLeft, Info, Shield, Bell, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationRead } from '../../services/userService'
import Layout from '../../components/Layout/Layout'
import '../../styles/dashboard.css'
import '../../styles/notifications.css'

interface NotifItem {
    _id: string
    title: string
    description: string
    type: string
    priority: string
    sentAt: string
    read: boolean
}

function groupByDate(items: NotifItem[]): Record<string, NotifItem[]> {
    const groups: Record<string, NotifItem[]> = {}
    const now = new Date()
    const today = now.toDateString()
    const yesterday = new Date(now.getTime() - 86400000).toDateString()

    for (const item of items) {
        const d = new Date(item.sentAt).toDateString()
        const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(item.sentAt).toLocaleDateString()
        if (!groups[label]) groups[label] = []
        groups[label].push(item)
    }
    return groups
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const typeIconMap: Record<string, any> = {
    system: Info,
    transaction: Wallet,
    security: Shield,
    marketing: Bell,
    announcement: Bell,
}

const tabTypeMap: Record<string, string | null> = {
    All: null,
    System: 'system',
    Deposit: 'transaction',
    Withdrawal: 'transaction',
}

export default function Notifications() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('All')
    const [allNotifs, setAllNotifs] = useState<NotifItem[]>([])

    useEffect(() => {
        getNotifications()
            .then(setAllNotifs)
            .catch(err => console.error('Notifications fetch error:', err))
    }, [])

    const handleRead = async (id: string) => {
        try {
            await markNotificationRead(id)
            setAllNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
        } catch { /* ignore */ }
    }

    const filtered = tabTypeMap[activeTab] === null
        ? allNotifs
        : allNotifs.filter(n => n.type === tabTypeMap[activeTab])

    const grouped = groupByDate(filtered)

    return (
        <Layout activePage="notifications" hideMobileNav={true}>
            <div className="notifications-container">
                {/* Mobile Header */}
                <div className="mobile-only mob-page-header">
                    <ArrowLeft size={22} className="mob-back-icon" onClick={() => navigate(-1)} />
                    <h1 className="mob-page-title">Notifications</h1>
                </div>

                <h1 className="notifications-title desktop-only">Notifications</h1>

                <div className="notifications-tabs">
                    {['All', 'System', 'Deposit', 'Withdrawal'].map(tab => (
                        <button
                            key={tab}
                            className={`notif-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="notifications-content">
                    {Object.keys(grouped).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#71717A' }}>
                            No notifications yet
                        </div>
                    ) : (
                        Object.entries(grouped).map(([group, list]) => (
                            <div key={group} className="notif-group">
                                <h3 className="group-title">{group}</h3>
                                <div className="notif-list">
                                    {list.map(notif => {
                                        const IconComp = typeIconMap[notif.type] || Info
                                        return (
                                            <div
                                                key={notif._id}
                                                className={`notif-card ${!notif.read ? 'unread' : ''}`}
                                                onClick={() => !notif.read && handleRead(notif._id)}
                                                style={{ cursor: notif.read ? 'default' : 'pointer', opacity: notif.read ? 0.7 : 1 }}
                                            >
                                                <div className={`notif-icon-box ${notif.type}`}>
                                                    <IconComp size={16} />
                                                </div>
                                                <div className="notif-info">
                                                    <div className="notif-header-row">
                                                        <h4 className="notif-label">{notif.title}</h4>
                                                        <span className="notif-time">{timeAgo(notif.sentAt)}</span>
                                                    </div>
                                                    <p className="notif-desc">{notif.description}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    )
}
