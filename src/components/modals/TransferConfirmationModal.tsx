import { X, Send } from 'lucide-react'

interface TransferConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    data: {
        recipient: string
        amount: string
        network: string
        asset?: string
    }
}

function TransferConfirmationModal({ isOpen, onClose, onConfirm, data }: TransferConfirmationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#111118] border border-[#1C1C2C] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-[#1C1C2C]">
                    <h3 className="text-xl font-bold text-white">Confirm Transfer</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mb-4">
                            <Send className="text-teal-500" size={32} />
                        </div>
                        <p className="text-zinc-400 text-sm mb-1">You are sending</p>
                        <h2 className="text-4xl font-bold text-white mb-6">
                            {data.amount} <span className="text-teal-500 text-2xl">{data.asset || 'USDT'}</span>
                        </h2>
                    </div>

                    <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-[#1C1C2C]">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-sm">Recipient</span>
                            <span className="text-white font-medium truncate max-w-[200px]">{data.recipient}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-sm">Network</span>
                            <span className="text-teal-500 font-medium">{data.network}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-sm">Transfer Fee</span>
                            <span className="text-white font-medium">0.00 USDT</span>
                        </div>
                    </div>

                    <button
                        onClick={onConfirm}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold text-lg mt-8 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Confirm & Send
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full text-zinc-500 hover:text-white py-4 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TransferConfirmationModal
