import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, FileText, Image, CheckCircle2, Flag, Lightbulb, X, Upload, Loader2 } from 'lucide-react';

type CheckState = 'initial' | 'input' | 'scanning' | 'result';
type InputMethod = 'text' | 'image' | null;

export function ScamCheckPage({ onBack }: { onBack: () => void }) {
  const [checkState, setCheckState] = useState<CheckState>('initial');
  const [inputMethod, setInputMethod] = useState<InputMethod>(null);
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  // Animate the loader
  useEffect(() => {
    if (checkState === 'scanning') {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 10) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [checkState]);

  const handlePasteText = () => {
    setInputMethod('text');
    setCheckState('input');
  };

  const handleUploadScreenshot = () => {
    setInputMethod('image');
    setCheckState('input');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setCheckState('scanning');

    // Simulate scanning process
    await new Promise(resolve => setTimeout(resolve, 2500));

    setCheckState('result');
  };

  const handleReset = () => {
    setCheckState('initial');
    setInputMethod(null);
    setInputText('');
    setUploadedImage(null);
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #F5F7FA 0%, #FFFFFF 100%)',
      minHeight: '100vh',
      height: '100vh',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Header */}
      <div
        className="relative flex-shrink-0"
        style={{ background: 'linear-gradient(167.377deg, rgb(0, 89, 189) 28.712%, rgb(23, 123, 175) 91.772%)' }}
      >
        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 pt-3 h-11">
          <span className="text-white text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '-0.24px' }}>12:30</span>
          <div className="flex items-center gap-2">
            {/* Cellular */}
            <svg width="17" height="11" viewBox="0 0 17 11" fill="white">
              <rect x="0" y="6" width="3" height="5" rx="0.5" fill="white" />
              <rect x="4.5" y="4" width="3" height="7" rx="0.5" fill="white" />
              <rect x="9" y="2" width="3" height="9" rx="0.5" fill="white" />
              <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="white" />
            </svg>
            {/* Wifi */}
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
              <path d="M8 8.5C8.69 8.5 9.25 9.06 9.25 9.75S8.69 11 8 11s-1.25-.56-1.25-1.25S7.31 8.5 8 8.5z" fill="white" />
              <path d="M8 5.5c1.38 0 2.63.56 3.54 1.46L12.96 5.54A6.48 6.48 0 008 3.5a6.48 6.48 0 00-4.96 2.04l1.42 1.42A4.48 4.48 0 018 5.5z" fill="white" />
              <path d="M8 2.5c2.21 0 4.21.9 5.66 2.34L15.08 3.42A8.97 8.97 0 008 .5a8.97 8.97 0 00-7.08 2.92l1.42 1.42A6.97 6.97 0 018 2.5z" fill="white" />
            </svg>
            {/* Battery */}
            <div className="relative flex items-center">
              <div className="border border-white/40 rounded-[2.5px] w-[22px] h-[11px] flex items-center pl-[2px]">
                <div className="bg-white rounded-[1.2px] w-[17px] h-[7px]" />
              </div>
              <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 bg-white/40 rounded-[1px] w-[2px] h-[4px]" />
            </div>
          </div>
        </div>

        {/* Navigation Row */}
        <div className="flex items-center justify-between px-5 pt-1 pb-0">
          <button
            onClick={onBack}
            className="rounded-full size-9 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="px-[30px] pt-3 pb-14">
          <h1 className="text-2xl font-bold text-white leading-8 mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
            Scam Check
          </h1>
          <p className="text-sm text-white/80 leading-5" style={{ fontFamily: 'Inter, sans-serif' }}>
            Verify suspicious messages before paying
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '20px',
        paddingBottom: '180px',
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>

        {/* Initial State - Main Scan Card */}
        {checkState === 'initial' && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '28px 24px',
            marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0, 85, 214, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#ECF2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Shield className="w-10 h-10" style={{ color: '#F9D801' }} />
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Check suspicious message
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.5 }}>
              Paste a message or upload a screenshot
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handlePasteText}
                style={{
                  width: '100%',
                  background: '#0055D6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '14px 18px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 12px rgba(0, 85, 214, 0.25)',
                }}
              >
                <FileText className="w-5 h-5" />
                Paste Text
              </button>
              <button
                onClick={handleUploadScreenshot}
                style={{
                  width: '100%',
                  background: 'white',
                  color: '#0055D6',
                  border: '2px solid #0055D6',
                  borderRadius: 16,
                  padding: '14px 18px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Image className="w-5 h-5" />
                Upload Screenshot
              </button>
            </div>
          </div>
        )}

        {/* Input State - Text Input */}
        {checkState === 'input' && inputMethod === 'text' && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '24px',
            marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0, 85, 214, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Paste Message Text
              </h3>
              <button
                onClick={handleReset}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X className="w-5 h-5" style={{ color: '#64748B' }} />
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the suspicious message here..."
              style={{
                width: '100%',
                minHeight: 180,
                padding: '14px 16px',
                border: '2px solid #E2E8F0',
                borderRadius: 12,
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                color: '#0F172A',
                resize: 'vertical',
                outline: 'none',
                marginBottom: 16,
              }}
              onFocus={(e) => { e.target.style.borderColor = '#0055D6'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; }}
            />

            <button
              onClick={handleAnalyze}
              disabled={!inputText.trim()}
              style={{
                width: '100%',
                background: inputText.trim() ? '#0055D6' : '#CBD5E1',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '14px 18px',
                fontSize: 15,
                fontWeight: 700,
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: inputText.trim() ? '0 4px 12px rgba(0, 85, 214, 0.25)' : 'none',
              }}
            >
              <Shield className="w-5 h-5" />
              Analyze Message
            </button>
          </div>
        )}

        {/* Input State - Image Upload */}
        {checkState === 'input' && inputMethod === 'image' && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '24px',
            marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0, 85, 214, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Upload Screenshot
              </h3>
              <button
                onClick={handleReset}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X className="w-5 h-5" style={{ color: '#64748B' }} />
              </button>
            </div>

            {!uploadedImage ? (
              <label style={{
                width: '100%',
                minHeight: 200,
                border: '2px dashed #CBD5E1',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginBottom: 16,
                padding: '24px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0055D6'; e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = 'transparent'; }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: '#ECF2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Upload className="w-7 h-7" style={{ color: '#0055D6' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
                  Click to upload image
                </p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                  PNG, JPG up to 10MB
                </p>
              </label>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  width: '100%',
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 12,
                  border: '2px solid #E2E8F0',
                }}>
                  <img
                    src={uploadedImage}
                    alt="Uploaded screenshot"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
                <button
                  onClick={() => setUploadedImage(null)}
                  style={{
                    width: '100%',
                    background: 'white',
                    color: '#64748B',
                    border: '2px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: 12,
                  }}
                >
                  Remove Image
                </button>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!uploadedImage}
              style={{
                width: '100%',
                background: uploadedImage ? '#0055D6' : '#CBD5E1',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '14px 18px',
                fontSize: 15,
                fontWeight: 700,
                cursor: uploadedImage ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: uploadedImage ? '0 4px 12px rgba(0, 85, 214, 0.25)' : 'none',
              }}
            >
              <Shield className="w-5 h-5" />
              Analyze Screenshot
            </button>
          </div>
        )}

        {/* Scanning State */}
        {checkState === 'scanning' && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '40px 24px',
            marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0, 85, 214, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#ECF2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <div style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.05s linear' }}>
                <Loader2 className="w-10 h-10" style={{ color: '#0055D6' }} />
              </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Analyzing message...
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Checking against scam database
            </p>
          </div>
        )}

        {/* Result State - Scam Detected */}
        {checkState === 'result' && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '24px',
            marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0, 85, 214, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '2px solid #FEF3C7',
          }}>
            {/* Status Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#FEF3C7',
              border: '1.5px solid #F59E0B',
              borderRadius: 12,
              padding: '6px 12px',
              marginBottom: 16,
            }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#D97706' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706', letterSpacing: '0.3px' }}>
                POTENTIAL SCAM
              </span>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Fake saman message detected
            </h3>

            {/* Detail */}
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 16, lineHeight: 1.5 }}>
              No official record found
            </p>

            {/* Advice Box */}
            <div style={{
              background: '#FFFBE5',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#D97706', marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                  Do not transfer money
                </p>
                <p style={{ fontSize: 13, color: '#78350F', margin: 0, lineHeight: 1.5 }}>
                  Do not click the link or make any payment
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Only show in result state */}
        {checkState === 'result' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <button
                style={{
                  width: '100%',
                  background: '#0055D6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '14px 18px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 12px rgba(0, 85, 214, 0.25)',
                }}
              >
                <CheckCircle2 className="w-5 h-5" />
                Check Official Record
              </button>
              <button
                style={{
                  width: '100%',
                  background: 'white',
                  color: '#DC2626',
                  border: '2px solid #DC2626',
                  borderRadius: 16,
                  padding: '14px 18px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Flag className="w-5 h-5" />
                Report Scam
              </button>
              <button
                onClick={handleReset}
                style={{
                  width: '100%',
                  background: 'white',
                  color: '#0055D6',
                  border: '2px solid #0055D6',
                  borderRadius: 16,
                  padding: '14px 18px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Shield className="w-5 h-5" />
                Check Another Message
              </button>
            </div>
          </>
        )}

        {/* Safety Tip Card */}
        <div style={{
          background: '#ECF2FE',
          borderRadius: 16,
          padding: '16px 18px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          marginBottom: 80,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#0055D6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Lightbulb className="w-5 h-5" style={{ color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0055D6', marginBottom: 4 }}>
              Safety Tip
            </p>
            <p style={{ fontSize: 13, color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>
              Touch 'n Go will never ask you to transfer money through unknown links.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
