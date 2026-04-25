import svgPaths from "./svg-w6hvyjthtu";

function Heading() {
  return (
    <div className="h-[28px] relative shrink-0 w-[111px]" data-name="Heading 2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-[-0.22px] not-italic text-[#101828] text-[18px] top-[-1.4px] whitespace-nowrap">Add Member</p>
      </div>
    </div>
  );
}

function AddMemberDialog() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-[398px]" data-name="AddMemberDialog">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center pl-[0.019px] relative size-full">
        <Heading />
      </div>
    </div>
  );
}

function DialogHeader() {
  return (
    <div className="absolute content-stretch flex flex-col h-[28px] items-start left-[26.2px] top-[40.2px] w-[114px]" data-name="DialogHeader">
      <AddMemberDialog />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[20px] left-[2px] top-[-2px] w-[278px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[-0.2px] not-italic text-[#4a5565] text-[14px] top-[-0.5px] whitespace-nowrap">{`Choose how to add members to "Edu 📚"`}</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p375d9e80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[-0.1px] px-[12px] rounded-[16px] size-[48px] top-0" style={{ backgroundImage: "linear-gradient(135deg, rgb(21, 93, 252) 0%, rgb(0, 146, 184) 100%)" }} data-name="Container">
      <Icon />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[24px] left-0 top-[0.01px] w-[231px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[-0.01px] not-italic text-[#101828] text-[16px] top-[-1.9px] whitespace-nowrap">Phone Number</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[16px] left-0 top-[24px] w-[231px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16px] left-[-0.01px] not-italic text-[#4a5565] text-[12px] top-[0.01px] whitespace-nowrap">Invite by mobile number</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute h-[40px] left-[63.91px] top-[4px] w-[231.087px]" data-name="Container">
      <Paragraph1 />
      <Paragraph2 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute h-[48px] left-[19.4px] top-[20.4px] w-[262px]" data-name="Container">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Button() {
  return (
    <div className="absolute bg-[#ecf2fe] border-[#0055d6] border-[1.6px] border-solid h-[91px] left-0 rounded-[16px] top-[37px] w-[308px]" data-name="Button">
      <Container />
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p203de200} id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.pee0ad00} id="Vector_2" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Container4() {
  return (
    <div className="bg-[#f3f4f6] relative rounded-[16px] shrink-0 size-[48px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[12px] relative size-full">
        <Icon1 />
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute h-[24px] left-0 top-[0.01px] w-[291px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[-0.1px] not-italic text-[#101828] text-[16px] top-[-1.9px] whitespace-nowrap">Invite Link</p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="absolute h-[16px] left-0 top-[24px] w-[291px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16px] left-[-0.1px] not-italic text-[#4a5565] text-[12px] top-[0.01px] whitespace-nowrap">Share join link</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="flex-[291_0_0] h-[40px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Paragraph3 />
        <Paragraph4 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex gap-[16.1px] h-[48px] items-center left-[19.9px] pl-[-0.1px] top-[19.9px] w-[355px]" data-name="Container">
      <Container4 />
      <Container5 />
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute bg-white border-[#e5e7eb] border-[1.6px] border-solid h-[91px] left-0 rounded-[16px] top-[141px] w-[308px]" data-name="Button">
      <Container3 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[23px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
        <g id="Icon">
          <path d={svgPaths.p11b36000} id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p362ea570} id="Vector_2" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p2dc92280} id="Vector_3" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1d881f00} id="Vector_4" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p193b0600} id="Vector_5" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M2.875 11.5H2.88458" id="Vector_6" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M11.5 2.875H11.5095" id="Vector_7" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M11.5 15.3333V15.343" id="Vector_8" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M15.3333 11.5H16.2917" id="Vector_9" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M20.125 11.5V11.5095" id="Vector_10" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M11.5 20.125V19.1667" id="Vector_11" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M20.125 20.125V20.1345" id="Vector_12" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-[#f3f4f6] relative rounded-[16px] shrink-0 size-[48px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pl-[7.494px] pr-[7.506px] relative size-full">
        <Icon2 />
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="absolute h-[24px] left-0 top-[0.01px] w-[291px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[-0.1px] not-italic text-[#101828] text-[16px] top-[-1.9px] whitespace-nowrap">QR Code</p>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="absolute h-[16px] left-0 top-[24px] w-[291px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16px] left-[-0.1px] not-italic text-[#4a5565] text-[12px] top-[0.01px] whitespace-nowrap">Scan to join</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="flex-[291_0_0] h-[40px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Paragraph5 />
        <Paragraph6 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex gap-[16.1px] h-[48px] items-center left-[19.9px] pl-[-0.1px] top-[19.9px] w-[355px]" data-name="Container">
      <Container7 />
      <Container8 />
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute bg-white border-[#e5e7eb] border-[1.6px] border-solid h-[91px] left-0 rounded-[16px] top-[244px] w-[308px]" data-name="Button">
      <Container6 />
    </div>
  );
}

function AddMemberDialog1() {
  return (
    <div className="-translate-x-1/2 absolute h-[335px] left-1/2 top-[75.2px] w-[308px]" data-name="AddMemberDialog">
      <Paragraph />
      <Button />
      <Button1 />
      <Button2 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
            <path d={svgPaths.p48af40} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
            <path d={svgPaths.p30908200} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[393.2px] opacity-70 rounded-[2px] size-[16px] top-[16.2px]" data-name="Button">
      <Icon3 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="absolute left-[313.2px] size-[16px] top-[20.2px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M12 4L4 12" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M4 4L12 12" id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

export default function Dialog() {
  return (
    <div className="bg-white border-[0.8px] border-[rgba(0,0,0,0.1)] border-solid overflow-clip relative rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-full" data-name="Dialog">
      <DialogHeader />
      <AddMemberDialog1 />
      <Button3 />
      <Icon4 />
    </div>
  );
}