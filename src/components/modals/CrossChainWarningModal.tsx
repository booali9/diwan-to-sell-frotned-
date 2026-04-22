import { X, AlertTriangle, ExternalLink } from 'lucide-react'

interface CrossChainWarningModalProps {
    isOpen: boolean
    onClose: () => void
    data: {
        selectedNetwork: string
        senderNetwork: string
        estimatedGasFee: string
    }
}

function CrossChainWarningModal({ isOpen, onClose, data }: CrossChainWarningModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#111118] border border-amber-500/30 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-[#1C1C2C]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="text-amber-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Warning</h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <h4 className="text-white font-bold text-lg mb-4">Different network detected!</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        Internal transfer can only be executed between users on the same default network.
                        A cross-chain transfer via bridge is required for this operation.
                    </p>

                    <div className="space-y-4 bg-amber-500/5 p-6 rounded-xl border border-amber-500/10 mb-8">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">Your Network</span>
                            <span className="text-white font-medium">{data?.senderNetwork}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">Receiver Network</span>
                            <span className="text-amber-500 font-medium">{data?.selectedNetwork}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">Estimated Bridge Fee</span>
                            <span className="text-white font-medium">{data?.estimatedGasFee}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                window.open('https://multichain.org', '_blank')
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            Continue to Bridge <ExternalLink size={18} />
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-[#1C1C2C] hover:bg-zinc-800 text-white py-4 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                    </div>

                    <p className="text-[10px] text-zinc-500 text-center mt-6 uppercase tracking-widest font-bold">
                        Simulated cross-chain environment
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CrossChainWarningModal
