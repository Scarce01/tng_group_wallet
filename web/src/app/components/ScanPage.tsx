import { ArrowLeft, Flashlight, Image as ImageIcon, QrCode } from 'lucide-react';
import { motion as Motion } from 'motion/react';

export function ScanPage({ onBack }: { onBack: () => void }) {
  return (
    <Motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 bg-black z-50 flex flex-col"
      style={{ minHeight: '100vh', width: '100%', maxWidth: '402px', margin: '0 auto' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <button onClick={onBack} className="p-2 text-white press-scale">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-white font-semibold text-lg font-['Open_Sans']">Scan QR</span>
        <button className="p-2 text-white press-scale">
          <span className="text-sm font-semibold">Help</span>
        </button>
      </div>

      {/* Scanner Viewport */}
      <div className="flex-1 relative flex flex-col items-center justify-center -mt-8 z-10">
        <div className="text-white text-center mb-6 px-8">
          <p className="font-semibold text-lg mb-1 drop-shadow-md font-['Open_Sans']">Align QR code within frame</p>
          <p className="text-sm opacity-80 drop-shadow-md font-['Open_Sans']">to scan and pay</p>
        </div>
        
        {/* Scanner Frame */}
        <div className="relative w-64 h-64 border border-white/20">
          {/* Corner marks */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#005AFF] rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#005AFF] rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#005AFF] rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#005AFF] rounded-br-lg" />
          
          {/* Scanning line animation */}
          <Motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-0.5 bg-[#005AFF] shadow-[0_0_8px_2px_rgba(0,90,255,0.5)] z-20"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-12 mt-12">
          <button className="flex flex-col items-center gap-2 text-white/90 press-scale">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold">Gallery</span>
          </button>
          <button className="flex flex-col items-center gap-2 text-white/90 press-scale">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Flashlight className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold">Torch</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet - Show QR */}
      <div className="bg-white rounded-t-3xl p-6 shadow-2xl z-10 mt-auto pb-safe">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
        
        <div className="flex items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 press-scale cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#005AFF]/10 rounded-full flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#005AFF]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-[15px] font-['Open_Sans']">Show QR to Pay</p>
              <p className="text-xs text-gray-500 font-['Open_Sans']">Present your code to merchant</p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
        </div>
      </div>
    </Motion.div>
  );
}
