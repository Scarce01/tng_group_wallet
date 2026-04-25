import svgPaths from "./svg-acag1cb9eq";

function Text() {
  return (
    <div className="h-[28px] relative shrink-0 w-[12.663px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[18px] text-white top-[-1.4px] whitespace-nowrap">A</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="relative rounded-[26843500px] shrink-0 size-[48px]" style={{ backgroundImage: "linear-gradient(135deg, rgb(0, 85, 214) 30.769%, rgb(87, 157, 217) 100%)" }} data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pl-[17.663px] pr-[17.675px] relative size-full">
        <Text />
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute content-stretch flex h-[15.988px] items-start left-0 top-0 w-[80.35px]" data-name="Paragraph">
      <p className="font-['Open_Sans:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#6b7280] text-[12px] whitespace-nowrap">Good morning,</p>
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute h-[28px] left-0 top-[15.99px] w-[80.35px]" data-name="Heading 1">
      <p className="absolute font-['Open_Sans:Bold',sans-serif] leading-[28px] left-0 not-italic text-[#1a1a1a] text-[18px] top-[-1.4px] whitespace-nowrap">Amanda</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[43.987px] relative shrink-0 w-[80.35px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Paragraph />
        <Heading />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[48px] relative shrink-0 w-[140.35px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container3 />
        <Container4 />
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p1a0498d0} id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p32f09b80} id="Vector_2" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1f77fe00} id="Vector_3" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p752a300} id="Vector_4" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M17.5 17.5V17.5083" id="Vector_5" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p8257960} id="Vector_6" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M2.5 10H2.50833" id="Vector_7" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 2.5H10.0083" id="Vector_8" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 13.3333V13.3417" id="Vector_9" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M13.3333 10H14.1667" id="Vector_10" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M17.5 10V10.0083" id="Vector_11" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 17.5V16.6667" id="Vector_12" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white relative rounded-[26843500px] shrink-0 size-[40px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[10px] relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p1c3efea0} id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p25877f40} id="Vector_2" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-white flex-[1_0_0] h-[40px] min-w-px relative rounded-[26843500px]" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[10px] relative size-full">
          <Icon1 />
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[40px] relative shrink-0 w-[88px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Button />
        <Button1 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between relative size-full">
          <Container2 />
          <Container5 />
        </div>
      </div>
    </div>
  );
}

function Text1() {
  return <div className="absolute h-[202px] left-0 top-0 w-[372px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 372 202\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -40.197 -43.027 0 372 0)\\'><stop stop-color=\\'rgba(255,255,255,0.1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(128,128,128,0.05)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }} data-name="Text" />;
}

function Paragraph1() {
  return (
    <div className="absolute content-stretch flex h-[15.988px] items-start left-0 top-0 w-[298.8px]" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Open_Sans:SemiBold',sans-serif] font-semibold leading-[16px] min-w-px relative text-[12px] text-[rgba(255,255,255,0.7)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Wallet Balance
      </p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[40px] left-0 top-[23.99px] w-[298.8px]" data-name="Paragraph">
      <p className="absolute font-['Open_Sans:Bold',sans-serif] leading-[40px] left-0 not-italic text-[36px] text-white top-[-2px] whitespace-nowrap">RM 1010.00</p>
    </div>
  );
}

function Container9() {
  return <div className="bg-[#05df72] rounded-[26843500px] shrink-0 size-[8px]" data-name="Container" />;
}

function Text2() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[77.05px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Open_Sans:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.9)] whitespace-nowrap">Active pools: 2</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[15.988px] items-center left-0 top-[67.99px] w-[298.8px]" data-name="Container">
      <Container9 />
      <Text2 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.pf942a70} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p3de9ee00} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.pbdf4440} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1fb905c0} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[69.6px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Open_Sans:SemiBold',sans-serif] font-semibold leading-[20px] left-[35px] text-[14px] text-center text-white top-[-0.2px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>{`Scan & Pay`}</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.15)] content-stretch flex gap-[8px] h-[45.6px] items-center justify-center left-0 px-[100.6px] py-[12.8px] rounded-[16px] top-[107.98px] w-[298.8px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <Icon2 />
      <Text3 />
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute h-[153.575px] left-[37px] top-[24px] w-[298.8px]" data-name="Container">
      <Paragraph1 />
      <Paragraph2 />
      <Container8 />
      <Button2 />
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[201.575px] overflow-clip relative rounded-[24px] shadow-[0px_8px_24px_0px_rgba(0,90,255,0.15)] shrink-0 w-full" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 372 201.57\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(18.6 10.079 -37.2 20.157 186 100.79)\\'><stop stop-color=\\'rgba(6,65,135,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(0,89,189,1)\\' offset=\\'0.47115\\'/><stop stop-color=\\'rgba(10,110,182,1)\\' offset=\\'0.73558\\'/><stop stop-color=\\'rgba(20,131,174,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }} data-name="Container">
      <Text1 />
      <Container7 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] h-[330px] items-start left-[9px] pt-[32px] px-[20px] top-[29px] w-[412px]" data-name="Container">
      <Container1 />
      <Container6 />
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[24px] relative shrink-0 w-[91.8px]" data-name="Heading 2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#1a1a1a] text-[16px] top-[-2.2px] whitespace-nowrap">Active Pools</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[59.713px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Inter:Bold',sans-serif] font-bold leading-[16px] not-italic relative shrink-0 text-[#005aff] text-[12px] text-center whitespace-nowrap">View All →</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex h-[24px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading1 />
      <Button3 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[#1a1a1a] text-[14px] top-[-0.2px] whitespace-nowrap">Langkawi Trip 🏝️</p>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#6b7280] text-[12px]">5 members</p>
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] h-[37.987px] items-start left-0 top-[3px] w-[249.788px]" data-name="Container">
      <Heading2 />
      <Paragraph3 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-full absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-[66px] not-italic text-[#045bcf] text-[18px] text-right top-[-1.4px] whitespace-nowrap">RM 650</p>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-right whitespace-nowrap">of RM 1150</p>
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute content-stretch flex flex-col h-[43.987px] items-start left-[249.79px] top-0 w-[65.013px]" data-name="Container">
      <Paragraph4 />
      <Paragraph5 />
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[43.987px] relative shrink-0 w-full" data-name="Container">
      <Container15 />
      <Container16 />
    </div>
  );
}

function Container18() {
  return <div className="bg-[#fddc00] h-[6px] rounded-[3px] shrink-0 w-full" data-name="Container" />;
}

function Container17() {
  return (
    <div className="bg-[#eef2f7] h-[6px] relative rounded-[3px] shrink-0 w-full" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start pr-[136.875px] relative size-full">
          <Container18 />
        </div>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="bg-white h-[93.988px] relative rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[12px] items-start pt-[16px] px-[16px] relative size-full">
        <Container14 />
        <Container17 />
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Heading 3">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[#1a1a1a] text-[14px] top-[-0.2px] whitespace-nowrap">Genting Trip 🎰</p>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#6b7280] text-[12px]">3 members</p>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] h-[37.987px] items-start left-0 top-[3px] w-[249.788px]" data-name="Container">
      <Heading3 />
      <Paragraph6 />
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-full absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-[66px] not-italic text-[#045bcf] text-[18px] text-right top-[-1.4px] whitespace-nowrap">RM 360</p>
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#9ca3af] text-[12px] text-right">of RM 900</p>
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute content-stretch flex flex-col h-[43.987px] items-start left-[249.79px] top-0 w-[65.013px]" data-name="Container">
      <Paragraph7 />
      <Paragraph8 />
    </div>
  );
}

function Container20() {
  return (
    <div className="h-[43.987px] relative shrink-0 w-full" data-name="Container">
      <Container21 />
      <Container22 />
    </div>
  );
}

function Container24() {
  return <div className="bg-[#fddc00] h-[6px] rounded-[3px] shrink-0 w-full" data-name="Container" />;
}

function Container23() {
  return (
    <div className="bg-[#eef2f7] h-[6px] relative rounded-[3px] shrink-0 w-full" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start pr-[188.888px] relative size-full">
          <Container24 />
        </div>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="bg-white h-[93.988px] relative rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[12px] items-start pt-[16px] px-[16px] relative size-full">
        <Container20 />
        <Container23 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] h-[199.975px] items-start relative shrink-0 w-full" data-name="Container">
      <Container13 />
      <Container19 />
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[236px] items-start left-[15px] px-[20px] top-[373px] w-[400px]" data-name="Container">
      <Container11 />
      <Container12 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="h-[24px] relative shrink-0 w-[148.8px]" data-name="Heading 2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Open_Sans:Bold',sans-serif] leading-[24px] left-0 not-italic text-[#1a1a1a] text-[16px] top-[-2.2px] whitespace-nowrap">Recent Transactions</p>
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="absolute h-[15.988px] left-[15px] top-[6.01px] w-[88.65px]" data-name="Text">
      <p className="-translate-x-1/2 absolute font-['Open_Sans:Bold',sans-serif] leading-[16px] left-[50px] not-italic text-[11px] text-center text-white top-0 whitespace-nowrap">All Transactions</p>
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute left-[116px] size-[14px] top-[7.01px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d="M3.5 5.25L7 8.75L10.5 5.25" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function TransactionFilterDropdown() {
  return (
    <div className="bg-[#0055d6] h-[28px] relative rounded-[26843500px] shrink-0 w-[142px]" data-name="TransactionFilterDropdown">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text4 />
        <Icon3 />
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex h-[27.988px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading4 />
      <TransactionFilterDropdown />
    </div>
  );
}

function Container31() {
  return (
    <div className="h-[28px] relative shrink-0 w-[9.45px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-[-5.27px] not-italic text-[#005aff] text-[20px] top-[0.01px] whitespace-nowrap">↑</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="bg-[#ecf2fe] relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[15.275px] relative size-full">
        <Container31 />
      </div>
    </div>
  );
}

function Paragraph9() {
  return (
    <div className="absolute h-[20px] left-0 overflow-clip top-0 w-[84.225px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#1a1a1a] text-[14px] top-[-0.2px] whitespace-nowrap">Hotel Booking</p>
    </div>
  );
}

function Text5() {
  return (
    <div className="absolute bg-[#eff6ff] content-stretch flex h-[20px] items-start left-[112px] px-[8px] py-[2px] rounded-[4px] top-[0.01px] w-[95px]" data-name="Text">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[16px] not-italic relative shrink-0 text-[#005aff] text-[10px] whitespace-nowrap">Langkawi Trip 🏝️</p>
    </div>
  );
}

function Container33() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Paragraph9 />
      <Text5 />
    </div>
  );
}

function Paragraph10() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#6b7280] text-[12px]">Ahmad • 19 Apr</p>
    </div>
  );
}

function Container32() {
  return (
    <div className="flex-[206.563_0_0] h-[37.987px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Container33 />
        <Paragraph10 />
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="h-[40px] relative shrink-0 w-[258.563px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container30 />
        <Container32 />
      </div>
    </div>
  );
}

function Paragraph11() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-full absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[57px] not-italic text-[#494949] text-[14px] text-right top-[-0.2px] whitespace-nowrap">-RM 150</p>
    </div>
  );
}

function Container34() {
  return (
    <div className="h-[20px] relative shrink-0 w-[56.237px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Paragraph11 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="bg-white h-[64px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[12px] relative size-full">
          <Container29 />
          <Container34 />
        </div>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="h-[28px] relative shrink-0 w-[9.45px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-[-5.27px] not-italic text-[#005aff] text-[20px] top-[0.01px] whitespace-nowrap">↑</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="bg-[#ecf2fe] relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[15.275px] relative size-full">
        <Container38 />
      </div>
    </div>
  );
}

function Paragraph12() {
  return (
    <div className="absolute h-[20px] left-0 overflow-clip top-0 w-[92.6px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#1a1a1a] text-[14px] top-[-0.2px] whitespace-nowrap">Casino Chips</p>
    </div>
  );
}

function Text6() {
  return (
    <div className="absolute bg-[#eff6ff] h-[20px] left-[118px] rounded-[4px] top-[0.01px] w-[89px]" data-name="Text">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[16px] left-[8px] not-italic text-[#005aff] text-[10px] top-[2px] whitespace-nowrap">Genting Trip 🎰</p>
    </div>
  );
}

function Container40() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Paragraph12 />
      <Text6 />
    </div>
  );
}

function Paragraph13() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#6b7280] text-[12px]">Ahmad • 18 Apr</p>
    </div>
  );
}

function Container39() {
  return (
    <div className="flex-[206.563_0_0] h-[37.987px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Container40 />
        <Paragraph13 />
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[40px] relative shrink-0 w-[258.563px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container37 />
        <Container39 />
      </div>
    </div>
  );
}

function Paragraph14() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-full absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[57px] not-italic text-[#494949] text-[14px] text-right top-[-0.2px] whitespace-nowrap">-RM 150</p>
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[20px] relative shrink-0 w-[56.237px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Paragraph14 />
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="bg-white h-[64px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[12px] relative size-full">
          <Container36 />
          <Container41 />
        </div>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="h-[28px] relative shrink-0 w-[9.45px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-[-5.27px] not-italic text-[#005aff] text-[20px] top-[0.01px] whitespace-nowrap">↑</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="bg-[#ecf2fe] relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[15.275px] relative size-full">
        <Container45 />
      </div>
    </div>
  );
}

function Paragraph15() {
  return (
    <div className="absolute h-[20px] left-0 overflow-clip top-0 w-[100.65px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#1a1a1a] text-[14px] top-[-0.2px] whitespace-nowrap">Dinner at Food Court</p>
    </div>
  );
}

function Text7() {
  return (
    <div className="absolute bg-[#eff6ff] h-[20px] left-[126px] rounded-[4px] top-[0.01px] w-[89px]" data-name="Text">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[16px] left-[8px] not-italic text-[#005aff] text-[10px] top-[2px] whitespace-nowrap">Genting Trip 🎰</p>
    </div>
  );
}

function Container47() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Paragraph15 />
      <Text7 />
    </div>
  );
}

function Paragraph16() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#6b7280] text-[12px]">Sarah • 18 Apr</p>
    </div>
  );
}

function Container46() {
  return (
    <div className="flex-[214.613_0_0] h-[37.987px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Container47 />
        <Paragraph16 />
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="h-[40px] relative shrink-0 w-[266.613px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container44 />
        <Container46 />
      </div>
    </div>
  );
}

function Paragraph17() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-full absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[49px] not-italic text-[#494949] text-[14px] text-right top-[-0.2px] whitespace-nowrap">-RM 90</p>
    </div>
  );
}

function Container48() {
  return (
    <div className="h-[20px] relative shrink-0 w-[48.188px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Paragraph17 />
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="bg-white h-[64px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[12px] relative size-full">
          <Container43 />
          <Container48 />
        </div>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="h-[28px] relative shrink-0 w-[9.45px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-[-4.27px] not-italic text-[#005aff] text-[20px] top-[0.01px] w-[17px]">↑</p>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="bg-[#ecf2fe] relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[15.275px] relative size-full">
        <Container52 />
      </div>
    </div>
  );
}

function Paragraph18() {
  return (
    <div className="absolute h-[20px] left-0 overflow-clip top-0 w-[92.6px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#1a1a1a] text-[14px] top-[-0.2px] whitespace-nowrap">Theme Park Tickets</p>
    </div>
  );
}

function Text8() {
  return (
    <div className="absolute bg-[#eff6ff] h-[20px] left-[118px] rounded-[4px] top-[-0.99px] w-[89px]" data-name="Text">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[16px] left-[8px] not-italic text-[#005aff] text-[10px] top-[2px] whitespace-nowrap">Genting Trip 🎰</p>
    </div>
  );
}

function Container54() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Paragraph18 />
      <Text8 />
    </div>
  );
}

function Paragraph19() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#6b7280] text-[12px]">Kumar • 18 Apr</p>
    </div>
  );
}

function Container53() {
  return (
    <div className="flex-[206.563_0_0] h-[37.987px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Container54 />
        <Paragraph19 />
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="h-[40px] relative shrink-0 w-[258.563px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container51 />
        <Container53 />
      </div>
    </div>
  );
}

function Paragraph20() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-full absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[57px] not-italic text-[#494949] text-[14px] text-right top-[-0.2px] whitespace-nowrap">-RM 240</p>
    </div>
  );
}

function Container55() {
  return (
    <div className="h-[20px] relative shrink-0 w-[56.237px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Paragraph20 />
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="bg-white h-[64px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[12px] relative size-full">
          <Container50 />
          <Container55 />
        </div>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="h-[28px] relative shrink-0 w-[19px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-0 not-italic text-[#005aff] text-[20px] top-[-1.2px] whitespace-nowrap">↑</p>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="bg-[#ecf2fe] relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[15.275px] relative size-full">
        <Container59 />
      </div>
    </div>
  );
}

function Paragraph21() {
  return (
    <div className="absolute h-[20px] left-0 overflow-clip top-0 w-[100.65px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#1a1a1a] text-[14px] top-[-0.2px] whitespace-nowrap">Cable Car Tickets</p>
    </div>
  );
}

function Text9() {
  return (
    <div className="absolute bg-[#eff6ff] h-[20px] left-[120px] rounded-[4px] top-[0.01px] w-[89px]" data-name="Text">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[16px] left-[8px] not-italic text-[#005aff] text-[10px] top-[2px] whitespace-nowrap">Genting Trip 🎰</p>
    </div>
  );
}

function Container61() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Paragraph21 />
      <Text9 />
    </div>
  );
}

function Paragraph22() {
  return (
    <div className="content-stretch flex h-[15.988px] items-start overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#6b7280] text-[12px]">Sarah • 17 Apr</p>
    </div>
  );
}

function Container60() {
  return (
    <div className="flex-[214.613_0_0] h-[37.987px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Container61 />
        <Paragraph22 />
      </div>
    </div>
  );
}

function Container57() {
  return (
    <div className="h-[40px] relative shrink-0 w-[266.613px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container58 />
        <Container60 />
      </div>
    </div>
  );
}

function Paragraph23() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-full absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[49px] not-italic text-[#494949] text-[14px] text-right top-[-0.2px] whitespace-nowrap">-RM 60</p>
    </div>
  );
}

function Container62() {
  return (
    <div className="h-[20px] relative shrink-0 w-[48.188px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Paragraph23 />
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="bg-white h-[64px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[12px] relative size-full">
          <Container57 />
          <Container62 />
        </div>
      </div>
    </div>
  );
}

function Container66() {
  return (
    <div className="h-[28px] relative shrink-0 w-[10px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[28px] left-[-5.27px] not-italic text-[#b98910] text-[20px] top-[0.01px] whitespace-nowrap">↓</p>
      </div>
    </div>
  );
}

function Container65() {
  return (
    <div className="bg-[#fff9d4] relative rounded-[10px] shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[15.275px] relative size-full">
        <Container66 />
      </div>
    </div>
  );
}

function Paragraph24() {
  return (
    <div className="absolute h-[20px] left-0 overflow-clip top-0 w-[88.363px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#1a1a1a] text-[14px] top-[-0.2px] whitespace-nowrap">Initial contribution</p>
    </div>
  );
}

function Text10() {
  return (
    <div className="absolute bg-[#eff6ff] h-[20px] left-[101px] rounded-[4px] top-[0.01px] w-[89px]" data-name="Text">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[16px] left-[8px] not-italic text-[#005aff] text-[10px] top-[2px] whitespace-nowrap">Genting Trip 🎰</p>
    </div>
  );
}

function Container68() {
  return (
    <div className="absolute h-[20px] left-0 right-0 top-0" data-name="Container">
      <Paragraph24 />
      <Text10 />
    </div>
  );
}

function Paragraph25() {
  return (
    <div className="absolute h-[15.988px] left-0 overflow-clip right-0 top-[22px]" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16px] left-0 not-italic right-0 text-[#6b7280] text-[12px] top-0">Ahmad • 17 Apr</p>
    </div>
  );
}

function Container67() {
  return (
    <div className="flex-[202.325_0_0] h-[37.987px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container68 />
        <Paragraph25 />
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[40px] items-center left-[12px] top-[12px] w-[254.325px]" data-name="Container">
      <Container65 />
      <Container67 />
    </div>
  );
}

function Paragraph26() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-full absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-[61px] not-italic text-[#10b981] text-[14px] text-right top-[-0.2px] whitespace-nowrap">+RM 300</p>
    </div>
  );
}

function Container69() {
  return (
    <div className="absolute content-stretch flex flex-col h-[20px] items-start left-[294.52px] top-[22px] w-[60.475px]" data-name="Container">
      <Paragraph26 />
    </div>
  );
}

function Container63() {
  return (
    <div className="bg-white h-[64px] relative rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] shrink-0 w-full" data-name="Container">
      <Container64 />
      <Container69 />
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[424px] items-start relative shrink-0 w-full" data-name="Container">
      <Container28 />
      <Container35 />
      <Container42 />
      <Container49 />
      <Container56 />
      <Container63 />
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[464px] items-start left-[8px] px-[20px] top-[650px] w-[407px]" data-name="Container">
      <Container26 />
      <Container27 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p1cbf6000} id="Vector" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p10779400} id="Vector_2" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Text11() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[33px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[#0055d6] text-[12px] text-center whitespace-nowrap">Home</p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="h-[59.987px] relative shrink-0 w-[49px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center p-[8px] relative size-full">
        <Icon4 />
        <Text11 />
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p1d820380} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p161d4800} id="Vector_2" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p2981fe00} id="Vector_3" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p13e20900} id="Vector_4" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Text12() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[24.087px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Pool</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="h-[59.987px] opacity-60 relative shrink-0 w-[40.088px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center p-[8px] relative size-full">
        <Icon5 />
        <Text12 />
      </div>
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p13253c0} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M16 7H22V13" id="Vector_2" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Text13() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[48.875px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Analytics</p>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="h-[59.987px] opacity-60 relative shrink-0 w-[64.875px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center p-[8px] relative size-full">
        <Icon6 />
        <Text13 />
      </div>
    </div>
  );
}

function Icon7() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p38ffec00} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p3cccb600} id="Vector_2" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Text14() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[35.1px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Profile</p>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="h-[59.987px] opacity-60 relative shrink-0 w-[51.1px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center p-[8px] relative size-full">
        <Icon7 />
        <Text14 />
      </div>
    </div>
  );
}

function Container71() {
  return (
    <div className="h-[59.987px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pl-[19.612px] pr-[19.65px] relative size-full">
          <Button4 />
          <Button5 />
          <Button6 />
          <Button7 />
        </div>
      </div>
    </div>
  );
}

function Container70() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[84px] items-start left-0 pt-[12px] px-[20px] shadow-[0px_-2px_12px_0px_rgba(0,0,0,0.04)] top-[1151px] w-[430px]" data-name="Container">
      <Container71 />
    </div>
  );
}

export default function IPhone1415ProMax() {
  return (
    <div className="bg-gradient-to-b from-[#bedcff] relative size-full to-[#faf9f7] to-[28.846%]" data-name="iPhone 14 & 15 Pro Max - 1">
      <Container />
      <Container10 />
      <Container25 />
      <div className="-translate-y-1/2 absolute h-[48px] left-[-2.33%] right-0 top-[calc(50%-636.5px)]" data-name="Light">
        <div className="absolute contents right-[14.34px] top-[18px]" data-name="Icons">
          <div className="absolute contents right-[14.34px] top-[18px]" data-name="Battery">
            <div className="absolute border border-black border-solid h-[11.333px] opacity-35 right-[16.67px] rounded-[2.667px] top-[18px] w-[22px]" data-name="Border" />
            <div className="absolute h-[4px] right-[14.34px] top-[21.67px] w-[1.328px]" data-name="Cap">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.32804 4">
                <path d={svgPaths.p32d253c0} fill="var(--fill-0, black)" id="Cap" opacity="0.4" />
              </svg>
            </div>
            <div className="absolute bg-black h-[7.333px] right-[18.67px] rounded-[1.333px] top-[20px] w-[18px]" data-name="Capacity" />
          </div>
          <div className="absolute h-[11px] right-[43.67px] top-[18px] w-[15.333px]" data-name="Wifi">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.333 10.9999">
              <path d={svgPaths.p39712400} fill="var(--fill-0, black)" id="Wifi" />
            </svg>
          </div>
          <div className="absolute h-[10.667px] right-[64px] top-[18px] w-[17px]" data-name="Cellular Connection">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 10.667">
              <path d={svgPaths.p26d17600} fill="var(--fill-0, black)" id="Cellular Connection" />
            </svg>
          </div>
        </div>
        <p className="absolute font-['IBM_Plex_Sans:SemiBold',sans-serif] font-semibold leading-[20px] left-[32px] text-[15px] text-black top-[calc(50%-8px)] tracking-[-0.24px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          12:30
        </p>
      </div>
      <Container70 />
    </div>
  );
}