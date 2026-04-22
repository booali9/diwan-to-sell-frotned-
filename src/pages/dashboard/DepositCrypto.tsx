import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Copy, Check, Clock, FileText, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getTransactions, submitDepositNotification } from '../../services/walletService'
import { useToast } from '../../context/ToastContext'
import Layout from '../../components/Layout/Layout'
import '../../styles/dashboard.css'

// ─── Static deposit addresses (shared by all users) ─────────────────────────
const DEPOSIT_ADDRESSES: Record<string, string> = {
  TRC20: 'TYZJvtMf88tpWNXyRurKujo5n9RBSwZDcG',
  BTC:   'bc1quethj66kepvz64wqcykaq9mdq5syv2kdlt9x5r',
  ERC20: '0x43c39E195Ba15D4DF17cEB74dF9fb28E6e52fb1c',
  BEP20: '0x43c39E195Ba15D4DF17cEB74dF9fb28E6e52fb1c',
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ASSETS = [
  { symbol: 'USDT', name: 'Tether USD', icon: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/usdt.png' },
  { symbol: 'BTC',  name: 'Bitcoin',    icon: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/btc.png'  },
  { symbol: 'ETH',  name: 'Ethereum',   icon: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/eth.png'  },
]
interface Network { name: string; tag: string; time: string; key: string }
const NETWORKS: Record<string, Network[]> = {
  USDT: [
    { name: 'Tron',      tag: 'TRC20', time: '~1 min',   key: 'trc20_TRC20' },
    { name: 'BNB Chain', tag: 'BEP20', time: '~2 mins',  key: 'evm_BEP20'   },
    { name: 'Ethereum',  tag: 'ERC20', time: '~5 mins',  key: 'evm_ERC20'   },
  ],
  BTC:  [{ name: 'Bitcoin',  tag: 'BTC',   time: '~10 mins', key: 'btc_BTC'   }],
  ETH:  [{ name: 'Ethereum', tag: 'ERC20', time: '~5 mins',  key: 'evm_ERC20' }],
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DepositCrypto() {
  const navigate  = useNavigate()
  const { toast } = useToast()

  const [showHistory,  setShowHistory]  = useState(false)
  const [historyTab,   setHistoryTab]   = useState<'deposit'|'withdrawal'|'other'>('deposit')
  const [transactions, setTransactions] = useState<any[]>([])
  const [copied,       setCopied]       = useState(false)
  const [selectedAsset,   setSelectedAsset]   = useState(ASSETS[0])
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS['USDT'][0])
  const [openAsset,    setOpenAsset]    = useState(false)
  const [openNetwork,  setOpenNetwork]  = useState(false)

  // deposit form
  const [amount,     setAmount]     = useState('')
  const [depositing, setDepositing] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const nets = NETWORKS[selectedAsset.symbol] || NETWORKS['USDT']
  const address = DEPOSIT_ADDRESSES[selectedNetwork.tag] ?? '—'

  const copy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true); toast('Address copied!', 'info')
    setTimeout(() => setCopied(false), 2000)
  }

  const pickAsset = (a: typeof ASSETS[0]) => {
    setSelectedAsset(a); setOpenAsset(false)
    setSelectedNetwork((NETWORKS[a.symbol] || NETWORKS['USDT'])[0])
  }

  const fetchTxns = () => getTransactions().then(setTransactions).catch(()=>{})
  useEffect(() => { fetchTxns() }, [])

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenAsset(false); setOpenNetwork(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDeposit = async () => {
    const num = parseFloat(amount)
    if (!num || num <= 0) { toast('Enter a valid amount', 'error'); return }
    setDepositing(true)
    try {
      await submitDepositNotification(num, selectedAsset.symbol, selectedNetwork.tag)
      toast(`Deposit of ${num} ${selectedAsset.symbol} submitted! Pending admin approval.`, 'info')
      setAmount('')
      await fetchTxns()
    } catch (err: any) {
      toast(err.message || 'Deposit submission failed', 'error')
    } finally {
      setDepositing(false)
    }
  }

  const historyItems = transactions.filter(t => {
    if (historyTab === 'deposit')    return t.type === 'deposit'    || t.type === 'adjustment'
    if (historyTab === 'withdrawal') return t.type === 'withdrawal'
    return !['deposit','withdrawal','adjustment'].includes(t.type)
  })

  // shared styles
  const card: React.CSSProperties = {
    background: '#111115', border: '1px solid #27272a', borderRadius: 16,
  }
  const dropBtn: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#18181b', border: '1px solid #27272a', borderRadius: 12,
    padding: '12px 14px', cursor: 'pointer',
  }
  const dropMenu: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
    background: '#18181b', border: '1px solid #27272a', borderRadius: 12,
    overflow: 'hidden', zIndex: 200,
    boxShadow: '0 12px 32px rgba(0,0,0,.7)',
  }
  const dropItem: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 14px', background: 'none', border: 'none',
    borderBottom: '1px solid #27272a', cursor: 'pointer',
  }

  // ── History ────────────────────────────────────────────────────────────────
  if (showHistory) {
    return (
      <Layout activePage="deposit" hideMobileNav hideFooterMobile>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 48px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
            <button onClick={()=>setShowHistory(false)}
              style={{ background:'#18181b', border:'1px solid #27272a', borderRadius:10, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}>
              <ArrowLeft size={18}/>
            </button>
            <span style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Transaction History</span>
          </div>
          <div style={{ display:'flex', background:'#18181b', borderRadius:12, padding:4, marginBottom:20 }}>
            {(['deposit','withdrawal','other'] as const).map(t=>(
              <button key={t} onClick={()=>setHistoryTab(t)}
                style={{ flex:1, padding:'8px 0', borderRadius:9, border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
                  background: historyTab===t ? '#0d9488' : 'transparent',
                  color:       historyTab===t ? '#fff'    : '#71717a' }}>
                {t[0].toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          {historyItems.length===0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#52525b' }}>
              <Clock size={36} style={{ margin:'0 auto 10px', display:'block', opacity:.4 }}/>
              <p style={{ margin:0, fontSize:14 }}>No records yet</p>
            </div>
          ) : historyItems.map(item=>(
            <div key={item._id} style={{ ...card, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#052e26', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check size={15} color="#10b981"/>
                </div>
                <div>
                  <div style={{ color:'#e4e4e7', fontWeight:600, fontSize:14 }}>{item.asset}</div>
                  <div style={{ color:'#52525b', fontSize:12 }}>{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color:'#10b981', fontWeight:700, fontSize:15 }}>+{item.amount}</div>
                <span style={{ display:'inline-block', marginTop:4, padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600,
                  background: item.status==='completed' ? '#052e26' : '#1c1408',
                  color:       item.status==='completed' ? '#10b981' : '#f59e0b' }}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <Layout activePage="deposit" hideMobileNav hideFooterMobile>
      <div ref={containerRef} style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 60px' }}>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <button onClick={()=>navigate(-1)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#a1a1aa', display:'flex', alignItems:'center', gap:6, padding:0, fontSize:14 }}>
            <ArrowLeft size={20}/><span>Back</span>
          </button>
          <span style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Deposit</span>
          <button onClick={()=>setShowHistory(true)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#71717a', display:'flex', padding:4 }}>
            <FileText size={20}/>
          </button>
        </div>

        {/* Asset + Network row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {/* Asset */}
          <div>
            <div style={{ fontSize:11, color:'#52525b', fontWeight:600, letterSpacing:'.5px', textTransform:'uppercase', marginBottom:6 }}>Asset</div>
            <div style={{ position:'relative' }}>
              <button onClick={()=>{setOpenAsset(!openAsset);setOpenNetwork(false)}} style={dropBtn}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <img src={selectedAsset.icon} style={{ width:24, height:24, borderRadius:'50%' }} alt={selectedAsset.symbol}/>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:14, lineHeight:1.2 }}>{selectedAsset.symbol}</div>
                    <div style={{ color:'#52525b', fontSize:11 }}>{selectedAsset.name}</div>
                  </div>
                </div>
                <ChevronDown size={16} color="#52525b" style={{ transform: openAsset?'rotate(180deg)':'none', transition:'.2s', flexShrink:0 }}/>
              </button>
              {openAsset && (
                <div style={dropMenu}>
                  {ASSETS.map(a=>(
                    <button key={a.symbol} onClick={()=>pickAsset(a)} style={{ ...dropItem, background: selectedAsset.symbol===a.symbol?'#0d1a19':'none' }}>
                      <img src={a.icon} style={{ width:22, height:22, borderRadius:'50%', flexShrink:0 }} alt={a.symbol}/>
                      <div style={{ flex:1, textAlign:'left' }}>
                        <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{a.symbol}</div>
                        <div style={{ color:'#52525b', fontSize:11 }}>{a.name}</div>
                      </div>
                      {selectedAsset.symbol===a.symbol && <Check size={14} color="#0d9488"/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Network */}
          <div>
            <div style={{ fontSize:11, color:'#52525b', fontWeight:600, letterSpacing:'.5px', textTransform:'uppercase', marginBottom:6 }}>Network</div>
            <div style={{ position:'relative' }}>
              <button onClick={()=>{setOpenNetwork(!openNetwork);setOpenAsset(false)}} style={dropBtn}>
                <div style={{ textAlign:'left', overflow:'hidden' }}>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:14, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{selectedNetwork.name}</div>
                  <div style={{ color:'#0d9488', fontSize:11 }}>{selectedNetwork.tag} · {selectedNetwork.time}</div>
                </div>
                <ChevronDown size={16} color="#52525b" style={{ transform: openNetwork?'rotate(180deg)':'none', transition:'.2s', flexShrink:0 }}/>
              </button>
              {openNetwork && (
                <div style={dropMenu}>
                  {nets.map(n=>(
                    <button key={n.key} onClick={()=>{setSelectedNetwork(n);setOpenNetwork(false)}} style={{ ...dropItem, background: selectedNetwork.key===n.key?'#0d1a19':'none' }}>
                      <div style={{ flex:1, textAlign:'left' }}>
                        <div style={{ color:'#fff', fontSize:13, fontWeight:600 }}>{n.name} <span style={{ color:'#71717a', fontWeight:400 }}>({n.tag})</span></div>
                        <div style={{ color:'#52525b', fontSize:11 }}>{n.time}</div>
                      </div>
                      {selectedNetwork.key===n.key && <Check size={14} color="#0d9488"/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR + Address card */}
        <div style={{ ...card, padding:'24px 20px', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <div style={{ background:'#fff', padding:10, borderRadius:14 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(address)}&bgcolor=ffffff&color=000000`}
                alt="QR" style={{ width:160, height:160, display:'block' }}
              />
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <span style={{ background:'#0d1a19', border:'1px solid #134e4a', borderRadius:20, padding:'4px 14px', fontSize:12, color:'#2dd4bf', fontWeight:600 }}>
              {selectedNetwork.name} · {selectedNetwork.tag}
            </span>
          </div>
          <div style={{ background:'#09090b', border:'1px solid #27272a', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ flex:1, color:'#a1a1aa', fontSize:13, fontFamily:'monospace', wordBreak:'break-all', lineHeight:1.5 }}>{address}</span>
            <button onClick={copy}
              style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, background: copied?'#0d9488':'#27272a', border:'none', borderRadius:8, padding:'8px 12px', cursor:'pointer', color:'#fff', fontSize:13, fontWeight:600, transition:'.2s', whiteSpace:'nowrap' }}>
              {copied ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy</>}
            </button>
          </div>
        </div>

        {/* Deposit amount form */}
        <div style={{ ...card, padding:'20px', marginBottom:16 }}>
          <div style={{ fontSize:13, color:'#a1a1aa', fontWeight:600, marginBottom:10 }}>Enter Deposit Amount</div>

          {/* Pending flow notice */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:8, background:'#1c1408', border:'1px solid #92400e', borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
            <Clock size={14} color="#f59e0b" style={{ flexShrink:0, marginTop:2 }}/>
            <span style={{ fontSize:12, color:'#fbbf24', lineHeight:1.5 }}>
              Your deposit will be reviewed and approved by an admin before being credited to your wallet.
            </span>
          </div>

          {/* amount input */}
          <div style={{ display:'flex', alignItems:'center', background:'#09090b', border:'1px solid #27272a', borderRadius:12, padding:'4px 4px 4px 14px', marginBottom:14 }}>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDeposit()}
              style={{ flex:1, minWidth:0, background:'none', border:'none', outline:'none', color:'#fff', fontSize:18, fontWeight:700, padding:'10px 0' }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#18181b', borderRadius:9, padding:'8px 10px', flexShrink:0, whiteSpace:'nowrap' }}>
              <img src={selectedAsset.icon} style={{ width:18, height:18, borderRadius:'50%', flexShrink:0 }} alt={selectedAsset.symbol}/>
              <span style={{ color:'#e4e4e7', fontWeight:700, fontSize:13 }}>{selectedAsset.symbol}</span>
            </div>
          </div>

          {/* quick fill buttons */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[100, 500, 1000, 5000].map(v => (
              <button key={v} onClick={()=>setAmount(String(v))}
                style={{ flex:1, background: amount===String(v)?'#0d9488':'#18181b', border:`1px solid ${amount===String(v)?'#0d9488':'#27272a'}`, borderRadius:8, padding:'7px 0', cursor:'pointer', color: amount===String(v)?'#fff':'#71717a', fontSize:12, fontWeight:600, transition:'.15s' }}>
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={handleDeposit}
            disabled={depositing || !amount || parseFloat(amount)<=0}
            style={{ width:'100%', background: depositing||!amount||parseFloat(amount)<=0 ? '#134e4a' : '#0d9488',
              border:'none', borderRadius:12, padding:'14px 0', cursor: depositing||!amount ? 'not-allowed':'pointer',
              color:'#fff', fontWeight:700, fontSize:16, transition:'.2s',
              opacity: depositing||!amount||parseFloat(amount)<=0 ? .6 : 1 }}>
            {depositing ? 'Submitting…' : `Submit Deposit ${amount ? parseFloat(amount).toLocaleString() : ''} ${selectedAsset.symbol}`}
          </button>
        </div>

        {/* Recent deposits */}
        <div style={{ ...card, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid #1f1f23' }}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Recent Deposits</span>
            <button onClick={()=>setShowHistory(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#0d9488', fontSize:13 }}>View all</button>
          </div>
          {transactions.filter(t=>t.type==='deposit'||t.type==='adjustment').length===0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#3f3f46', fontSize:13 }}>No deposits yet</div>
          ) : (
            transactions.filter(t=>t.type==='deposit'||t.type==='adjustment').slice(0,5).map(tx=>(
              <div key={tx._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #1a1a1e' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'#052e26', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Check size={14} color="#10b981"/>
                  </div>
                  <div>
                    <div style={{ color:'#e4e4e7', fontWeight:600, fontSize:14 }}>{tx.asset}</div>
                    <div style={{ color:'#52525b', fontSize:12 }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:'#10b981', fontWeight:700, fontSize:14 }}>+{tx.amount}</div>
                  <div style={{ fontSize:11, fontWeight:600, color: tx.status==='completed'?'#10b981':'#f59e0b' }}>{tx.status}</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </Layout>
  )
}
