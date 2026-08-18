import { QrCode, XCircle } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodeModal({ isOpen, onClose }: QrCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 border border-zinc-200 max-w-sm w-full text-center space-y-4 shadow-lg animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 text-sm">
            Escanea para Pagar por QR
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 transition"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-zinc-50/60 p-4 rounded-lg border border-zinc-200 inline-block">
          <div className="w-48 h-48 bg-zinc-900 rounded-md flex flex-col items-center justify-center text-zinc-50 p-2">
            <QrCode className="h-32 w-32 text-zinc-50" />
            <span className="text-[10px] text-zinc-400 mt-2 font-mono">
              PLIN / YAPE CENTRO MEDIC
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-zinc-900 hover:bg-zinc-900/90 text-zinc-50 font-medium py-2 rounded-md shadow transition text-xs"
        >
          CONFIRMAR PAGO DIGITAL
        </button>
      </div>
    </div>
  );
}
