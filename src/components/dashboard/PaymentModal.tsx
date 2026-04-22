import { X, Copy, Check, Clock, ShieldCheck, QrCode, Wallet } from 'lucide-react';
import { useState } from 'react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'deposit' | 'withdrawal';
    amount: string;
    currency: string;
    address?: string;
    network?: string;
    status?: string;
    usdAmount?: string;
}

// Map NowPayments ticker back to display name
const currencyDisplayName = (ticker: string): string => {
    const map: Record<string, string> = {
        usdttrc20: 'USDT',
        usdterc20: 'USDT',
        usdtbsc: 'USDT',
        btc: 'BTC',
        eth: 'ETH',
        usdt: 'USDT',
    };
    return map[ticker?.toLowerCase()] || ticker?.toUpperCase() || '';
};

const networkDisplayName = (network: string): string => {
    if (!network) return '';
    // Already formatted like "BNB Smart Chain (BEP20)"
    if (network.includes('(')) return network;
    const map: Record<string, string> = {
        bsc: 'BNB Smart Chain (BEP20)',
        tron: 'Tron (TRC20)',
        eth: 'Ethereum (ERC20)',
    };
    return map[network.toLowerCase()] || network;
};

const PaymentModal = ({ isOpen, onClose, type, amount, currency, address, network, usdAmount }: PaymentModalProps) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const displayCurrency = currencyDisplayName(currency);
    const displayNetwork = networkDisplayName(network || '');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="w-full max-w-[420px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                style={{ perspective: '1000px' }}
            >
                <div className="relative bg-[#0f0f13] rounded-2xl border border-white/[0.06] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.6)]">

                    {/* ── Header ── */}
                    <div className="relative px-6 pt-6 pb-5">
                        {/* Subtle gradient glow behind header */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-teal-500/8 blur-3xl pointer-events-none" />

                        <div className="relative flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                    {type === 'deposit' ? (
                                        <Wallet size={17} className="text-teal-400" />
                                    ) : (
                                        <Clock size={17} className="text-amber-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-semibold text-white">
                                        {type === 'deposit' ? 'Complete Deposit' : 'Withdrawal Processing'}
                                    </h3>
                                    <p className="text-[11px] text-zinc-500 mt-px">
                                        {type === 'deposit' ? 'Send the exact amount to the address' : 'Your request is being processed'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* ── Amount Card ── */}
                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 mb-2">
                                        You pay
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                                            {amount}
                                        </span>
                                        <span className="text-sm font-semibold text-teal-400">
                                            {displayCurrency}
                                        </span>
                                    </div>
                                    {usdAmount && usdAmount !== amount && (
                                        <p className="text-[11px] text-zinc-500 mt-1.5">
                                            ≈ ${usdAmount} USD
                                        </p>
                                    )}
                                </div>
                                {displayNetwork && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-400/80 bg-teal-500/8 border border-teal-500/10 px-2 py-1 rounded-md mt-0.5">
                                        {displayNetwork}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Deposit Content ── */}
                    {type === 'deposit' && address && (
                        <>
                            {/* Divider */}
                            <div className="mx-6 h-px bg-white/[0.04]" />

                            <div className="px-6 py-5 space-y-5">
                                {/* QR Code */}
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="bg-white rounded-xl p-3 shadow-lg shadow-black/20">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${address}&margin=0`}
                                                alt="QR Code"
                                                className="w-[160px] h-[160px] rounded-sm"
                                            />
                                        </div>
                                        {/* Small icon overlay on QR center */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow-sm">
                                                <QrCode size={16} className="text-zinc-900" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Block */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                                            Deposit Address
                                        </p>
                                        <button
                                            onClick={handleCopy}
                                            className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded transition-all duration-200 ${
                                                copied
                                                    ? 'text-teal-400 bg-teal-500/10'
                                                    : 'text-zinc-500 hover:text-teal-400 hover:bg-white/[0.03]'
                                            }`}
                                        >
                                            {copied ? <Check size={10} /> : <Copy size={10} />}
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <div
                                        onClick={handleCopy}
                                        className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-3.5 py-3 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group"
                                    >
                                        <code className="text-[12px] text-zinc-400 font-mono break-all leading-[1.6] group-hover:text-zinc-300 transition-colors select-all">
                                            {address}
                                        </code>
                                    </div>
                                </div>

                                {/* Warning */}
                                <div className="flex items-start gap-2.5 bg-amber-500/[0.04] border border-amber-500/[0.08] rounded-lg px-3.5 py-3">
                                    <ShieldCheck size={14} className="text-amber-500/60 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-zinc-500 leading-[1.5]">
                                        Only send <span className="text-zinc-300 font-medium">{displayCurrency}</span> via{' '}
                                        <span className="text-zinc-300 font-medium">{displayNetwork}</span>.
                                        Sending other tokens may result in permanent loss.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Withdrawal Content ── */}
                    {type === 'withdrawal' && (
                        <div className="px-6 py-8 flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                                    <Clock size={22} className="text-amber-400" />
                                </div>
                                <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-zinc-300">
                                    Withdrawing <span className="text-white font-semibold">{amount} {displayCurrency}</span>
                                </p>
                                <p className="text-xs text-zinc-500">
                                    You'll be notified once approved
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── CTA Button ── */}
                    <div className="px-6 pb-6 pt-1">
                        <button
                            onClick={onClose}
                            className="w-full h-12 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] shadow-[0_4px_12px_rgba(20,184,166,0.15)] hover:shadow-[0_4px_20px_rgba(20,184,166,0.25)]"
                        >
                            {type === 'deposit' ? 'I have sent the payment' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
