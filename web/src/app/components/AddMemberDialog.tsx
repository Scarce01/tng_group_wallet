import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { ArrowLeft, Phone, CheckCircle2, AlertCircle, Users, Calculator, Send, MessageSquare, Link as LinkIcon, UserPlus, Lightbulb, ArrowDown, Bell, Clock, Info } from 'lucide-react';
import svgPaths from '../../imports/Dialog-3/svg-gwd6p6tzs9';
import successSvgPaths from '../../imports/Dialog-11/svg-9liafpvnfh';

interface Member {
  id: string;
  name: string;
  phone: string;
  status: 'joined' | 'pending' | 'declined';
  profilePicture?: string;
  verified?: boolean;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
  currentMembers: number;
  poolBalance: number;
  hasTransactions: boolean;
  onAddMember: (phone: string, method: 'invite' | 'sms') => void;
}

type Step = 'method' | 'phone-input' | 'user-found' | 'user-not-found' | 'approval-settings' | 'split-recalc' | 'success';

export function AddMemberDialog({
  open,
  onOpenChange,
  poolName,
  currentMembers,
  poolBalance,
  hasTransactions,
  onAddMember
}: AddMemberDialogProps) {
  const [step, setStep] = useState<Step>('method');
  const [countryCode, setCountryCode] = useState('+60');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [foundUser, setFoundUser] = useState<Member | null>(null);
  const [splitOption, setSplitOption] = useState<'future' | 'rebalance'>('future');

  // Mock user lookup
  const handleCheckUser = () => {
    const cleanPhone = phoneNumber.replace(/\s|-/g, '');

    // Simulate user found
    if (cleanPhone === '123456789') {
      setFoundUser({
        id: '1',
        name: 'John Tan',
        phone: `${countryCode} ${phoneNumber}`,
        status: 'pending',
        verified: true,
      });
      setStep('user-found');
    } else {
      setStep('user-not-found');
    }
  };

  const handleSendInvite = () => {
    if (hasTransactions) {
      setStep('approval-settings');
    } else {
      setStep('split-recalc');
    }
  };

  const handleConfirmSplit = () => {
    onAddMember(phoneNumber, 'invite');
    setStep('success');
  };

  const handleSendSMS = () => {
    onAddMember(phoneNumber, 'sms');
    setStep('success');
  };

  const handleClose = () => {
    setStep('method');
    setPhoneNumber('');
    setFoundUser(null);
    onOpenChange(false);
  };

  const oldSplitAmount = poolBalance / currentMembers;
  const newSplitAmount = poolBalance / (currentMembers + 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[360px] max-w-[calc(100%-2rem)] rounded-[24px] border-[0.8px] border-[rgba(0,0,0,0.1)] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] p-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pt-[40px] px-[26px] pb-0">
          <div className="flex items-center gap-3">
            {step !== 'method' && step !== 'success' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === 'phone-input') setStep('method');
                  else if (step === 'user-found' || step === 'user-not-found') setStep('phone-input');
                  else if (step === 'approval-settings') setStep(foundUser ? 'user-found' : 'user-not-found');
                  else if (step === 'split-recalc') setStep('approval-settings');
                }}
                className="p-0 h-auto hover:bg-transparent"
              >
                <ArrowLeft className="w-5 h-5 text-gray-900" />
              </Button>
            )}
            <DialogTitle className="font-['Inter'] font-bold leading-[28px] text-[#101828] text-[18px]">
              {step === 'method' && 'Add Member'}
              {step === 'phone-input' && 'Enter Phone Number'}
              {step === 'user-found' && 'User Found'}
              {step === 'user-not-found' && 'User Not Registered'}
              {step === 'approval-settings' && 'Split Settings'}
              {step === 'split-recalc' && 'Split Recalculation'}
              {step === 'success' && 'Invite Sent!'}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Add a new member to the pool by phone number
          </DialogDescription>
        </DialogHeader>

        <div className="px-[26px] pb-[26px] pt-[20px]">
          {/* Step: Choose Method */}
          {step === 'method' && (
            <div className="space-y-[13px]">
              <p className="text-[14px] text-[#4a5565] font-normal leading-[20px] mb-[17px]">
                Choose how to add members to "{poolName}"
              </p>

              {/* Phone Number Option - TNG Blue Gradient */}
              <button
                onClick={() => setStep('phone-input')}
                className="relative w-full h-[91px] bg-[#ecf2fe] border-[1.6px] border-[#0055d6] rounded-[16px] hover:border-[#004bb8] transition-all active:scale-[0.98]"
              >
                <div className="absolute h-[48px] left-[19.4px] top-[20.4px] right-[19.4px] flex items-center gap-4">
                  {/* Icon Container with Gradient */}
                  <div
                    className="shrink-0 w-[48px] h-[48px] rounded-[16px] flex items-center justify-center"
                    style={{ backgroundImage: "linear-gradient(135deg, rgb(21, 93, 252) 0%, rgb(0, 146, 184) 100%)" }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <path
                        d={svgPaths.p375d9e80}
                        stroke="white"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  {/* Text Container */}
                  <div className="flex-1 text-left">
                    <p className="font-['Inter'] font-bold leading-[24px] text-[#101828] text-[16px]">
                      Phone Number
                    </p>
                    <p className="font-['Inter'] font-medium leading-[16px] text-[#4a5565] text-[12px]">
                      Invite by mobile number
                    </p>
                  </div>
                </div>
              </button>

              {/* Invite Link Option - White */}
              <button className="relative w-full h-[91px] bg-white border-[1.6px] border-[#e5e7eb] rounded-[16px] hover:border-[#d1d5db] transition-all active:scale-[0.98]">
                <div className="absolute h-[48px] left-[19.9px] top-[19.9px] right-[19.9px] flex items-center gap-4">
                  {/* Icon Container */}
                  <div className="shrink-0 w-[48px] h-[48px] bg-[#f3f4f6] rounded-[16px] flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <path
                        d={svgPaths.p203de200}
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d={svgPaths.pee0ad00}
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  {/* Text Container */}
                  <div className="flex-1 text-left">
                    <p className="font-['Inter'] font-bold leading-[24px] text-[#101828] text-[16px]">
                      Invite Link
                    </p>
                    <p className="font-['Inter'] font-medium leading-[16px] text-[#4a5565] text-[12px]">
                      Share join link
                    </p>
                  </div>
                </div>
              </button>

              {/* QR Code Option - White */}
              <button className="relative w-full h-[91px] bg-white border-[1.6px] border-[#e5e7eb] rounded-[16px] hover:border-[#d1d5db] transition-all active:scale-[0.98]">
                <div className="absolute h-[48px] left-[19.9px] top-[19.9px] right-[19.9px] flex items-center gap-4">
                  {/* Icon Container */}
                  <div className="shrink-0 w-[48px] h-[48px] bg-[#f3f4f6] rounded-[16px] flex items-center justify-center">
                    <svg className="w-[23px] h-[23px]" fill="none" viewBox="0 0 23 23">
                      <path
                        d={svgPaths.p11b36000}
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d={svgPaths.p362ea570}
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d={svgPaths.p2dc92280}
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d={svgPaths.p1d881f00}
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d={svgPaths.p193b0600}
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d="M2.875 11.5H2.88458"
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d="M11.5 2.875H11.5095"
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d="M11.5 15.3333V15.343"
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d="M15.3333 11.5H16.2917"
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d="M20.125 11.5V11.5095"
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d="M11.5 20.125V19.1667"
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                      <path
                        d="M20.125 20.125V20.1345"
                        stroke="#6B7280"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.66667"
                      />
                    </svg>
                  </div>
                  {/* Text Container */}
                  <div className="flex-1 text-left">
                    <p className="font-['Inter'] font-bold leading-[24px] text-[#101828] text-[16px]">
                      QR Code
                    </p>
                    <p className="font-['Inter'] font-medium leading-[16px] text-[#4a5565] text-[12px]">
                      Scan to join
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step: Phone Input */}
          {step === 'phone-input' && (
            <div className="space-y-4 pt-2">
              <div className="bg-[#ecf2fe] border-2 border-[#bedcff] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#0055D6] mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#101828]">Smart Lookup</p>
                    <p className="text-xs text-[#4a5565]">We'll check if this number is registered</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">COUNTRY CODE</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:border-[#0055D6]"
                >
                  <option value="+60">🇲🇾 +60 Malaysia</option>
                  <option value="+65">🇸🇬 +65 Singapore</option>
                  <option value="+62">🇮🇩 +62 Indonesia</option>
                  <option value="+66">🇹🇭 +66 Thailand</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">PHONE NUMBER</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="12-345 6789"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:border-[#0055D6]"
                />
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-gray-500" strokeWidth={2} />
                  <p className="text-xs font-bold text-gray-500">QUICK SUGGESTIONS</p>
                </div>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 bg-white rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2">
                    <Phone size={14} className="text-gray-900" strokeWidth={2} />
                    <p className="text-sm font-medium text-gray-900">Import from Contacts</p>
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-white rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2">
                    <Users size={14} className="text-gray-900" strokeWidth={2} />
                    <p className="text-sm font-medium text-gray-900">Recent Invites</p>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleCheckUser}
                disabled={!phoneNumber}
                className="w-full h-12 rounded-2xl bg-[#0055D6] hover:bg-[#004bb8] text-white font-bold shadow-lg disabled:opacity-50"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step: User Found */}
          {step === 'user-found' && foundUser && (
            <div className="space-y-4 pt-2">
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-bold text-green-900">User Found!</p>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 bg-gradient-to-br from-blue-600 to-cyan-600">
                    <AvatarFallback className="text-xl font-bold text-white">
                      {foundUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-gray-900">{foundUser.name}</p>
                      {foundUser.verified && (
                        <CheckCircle2 className="w-4 h-4 text-[#0055D6]" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{foundUser.phone}</p>
                    <Badge className="bg-[#ecf2fe] text-[#4a5565] border-[#bedcff] text-xs font-bold mt-1">
                      Verified User
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-[#ecf2fe] border-2 border-[#bedcff] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={14} className="text-[#101828]" strokeWidth={2} />
                  <p className="text-xs font-bold text-[#101828]">WHAT HAPPENS NEXT</p>
                </div>
                <div className="space-y-2 text-xs text-[#4a5565]">
                  <p>• {foundUser.name} will receive instant notification</p>
                  <p>• They can Accept or Decline the invitation</p>
                  <p>• Split will auto-recalculate after approval</p>
                </div>
              </div>

              <Button
                onClick={handleSendInvite}
                className="w-full h-12 rounded-2xl bg-[#0055D6] hover:bg-[#004bb8] text-white font-bold shadow-lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </div>
          )}

          {/* Step: User Not Found */}
          {step === 'user-not-found' && (
            <div className="space-y-4 pt-2">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm font-bold text-orange-900">Not Registered</p>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  {countryCode} {phoneNumber} is not registered yet
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-3">Choose invite method:</p>

                <button
                  onClick={handleSendSMS}
                  className="w-full p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl hover:border-green-300 transition-all active:scale-98 mb-3"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                    <div className="flex-1 text-left">
                      <p className="text-base font-bold text-gray-900">Send SMS Invite</p>
                      <p className="text-xs text-gray-600">They'll get signup link via SMS</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 transition-all active:scale-98">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-6 h-6 text-[#0055D6]" />
                    <div className="flex-1 text-left">
                      <p className="text-base font-bold text-gray-900">Copy Registration Link</p>
                      <p className="text-xs text-gray-600">Share link manually</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="bg-[#ecf2fe] border-2 border-[#bedcff] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-[#101828]" strokeWidth={2} />
                  <p className="text-xs font-bold text-[#101828]">SMS PREVIEW</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-xs text-gray-700 border border-[#bedcff]">
                  "You've been invited to join <strong>{poolName}</strong>. Download the app to join & view details: [link]"
                </div>
              </div>
            </div>
          )}

          {/* Step: Approval Settings (if pool has transactions) */}
          {step === 'approval-settings' && (
            <div className="space-y-4 pt-2">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-orange-900">Pool Has Transactions</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Adding a new member will affect split calculations
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-700 mb-3">CHOOSE SPLIT OPTION</p>

                <div className="space-y-3">
                  <button
                    onClick={() => setSplitOption('future')}
                    className={`w-full p-4 border-2 rounded-2xl transition-all text-left ${
                      splitOption === 'future'
                        ? 'bg-[#ecf2fe] border-blue-600'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        splitOption === 'future' ? 'border-blue-600' : 'border-gray-300'
                      }`}>
                        {splitOption === 'future' && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">Apply to Future Only</p>
                        <p className="text-xs text-gray-600 mt-1">Past transactions stay unchanged</p>
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs mt-2">Recommended</Badge>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSplitOption('rebalance')}
                    className={`w-full p-4 border-2 rounded-2xl transition-all text-left ${
                      splitOption === 'rebalance'
                        ? 'bg-[#ecf2fe] border-blue-600'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                        splitOption === 'rebalance' ? 'border-blue-600' : 'border-gray-300'
                      }`}>
                        {splitOption === 'rebalance' && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">Rebalance Everything</p>
                        <p className="text-xs text-gray-600 mt-1">Recalculate all past splits</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                onClick={() => setStep('split-recalc')}
                className="w-full h-12 rounded-2xl bg-[#0055D6] hover:bg-[#004bb8] text-white font-bold"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step: Split Recalculation */}
          {step === 'split-recalc' && (
            <div className="space-y-4 pt-2">
              <div className="bg-[#ecf2fe] border-2 border-[#bedcff] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-[#0055D6]" />
                  <p className="text-sm font-bold text-[#101828]">Auto Recalculation</p>
                </div>
                <p className="text-xs text-[#4a5565]">
                  Split amounts will automatically adjust when the new member joins
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator size={14} className="text-gray-500" strokeWidth={2} />
                  <p className="text-xs font-bold text-gray-500">BEFORE & AFTER</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Current Split</span>
                      <Badge className="bg-gray-100 text-gray-700 border-0">{currentMembers} members</Badge>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-xl font-bold text-gray-900">RM {oldSplitAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">per person</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown size={24} className="text-gray-400" strokeWidth={2} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">New Split</span>
                      <Badge className="bg-[#0055D6] text-white border-0">{currentMembers + 1} members</Badge>
                    </div>
                    <div className="bg-[#ecf2fe] border-2 border-[#0055d6] rounded-xl p-3">
                      <p className="text-xl font-bold text-[#0055D6]">RM {newSplitAmount.toFixed(2)}</p>
                      <p className="text-xs text-[#4a5565]">per person</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-green-900" strokeWidth={2} />
                  <p className="text-xs font-bold text-green-900">BENEFITS</p>
                </div>
                <div className="space-y-1 text-xs text-green-700">
                  <p>• Lower contribution per person</p>
                  <p>• Fair distribution across all members</p>
                  <p>• Transparent split tracking</p>
                </div>
              </div>

              <Button
                onClick={handleConfirmSplit}
                className="w-full h-12 rounded-2xl bg-[#0055D6] hover:bg-[#004bb8] text-white font-bold shadow-lg"
              >
                Confirm & Send Invite
              </Button>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="relative pt-[44px] pb-[100px]">
              {/* Success Circle Icon - Exact Figma positioning */}
              <div className="absolute left-1/2 -translate-x-1/2 w-[77px] h-[77px] top-[64.2px]">
                <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 77 77">
                  <g>
                    <path
                      d={successSvgPaths.p9c22600}
                      stroke="#10B981"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                    />
                    <path
                      d={successSvgPaths.p1ea90100}
                      stroke="#10B981"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                    />
                  </g>
                </svg>
              </div>

              <div className="mt-[100px] space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Invite Sent!</h3>
                  <p className="text-sm text-gray-600 text-center">
                    {foundUser
                      ? `${foundUser.name} will be notified instantly`
                      : 'SMS invitation sent successfully'
                    }
                  </p>
                </div>

                <div className="bg-[#ecf2fe] border-2 border-[#bedcff] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-[#101828]" strokeWidth={2} />
                    <p className="text-xs font-bold text-[#101828]">PENDING INVITES</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#4a5565]">Track in Member List</span>
                    <Badge className="bg-yellow-100 text-yellow-800 border-0 flex items-center gap-1">
                      <Clock size={12} className="text-yellow-800" strokeWidth={2} />
                      Pending
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={handleClose}
                  className="w-full h-12 rounded-2xl bg-[#0055D6] hover:bg-[#004bb8] text-white font-bold"
                >
                  Done
                </Button>

                <button
                  onClick={() => {
                    setStep('phone-input');
                    setPhoneNumber('');
                    setFoundUser(null);
                  }}
                  className="text-sm font-bold text-[#0055D6] hover:underline w-full text-center"
                >
                  Invite Another Member
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
