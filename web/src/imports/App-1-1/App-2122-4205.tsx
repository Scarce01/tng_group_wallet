import svgPaths from "./svg-ve4mdgnspy";

function Text() {
  return (
    <div className="h-[20px] relative shrink-0 w-[34.612px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['IBM_Plex_Sans:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[14px] text-white top-[0.6px] tracking-[-0.24px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          12:30
        </p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute h-[11px] left-0 top-0 w-[17px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 11">
        <g clipPath="url(#clip0_2122_4013)" id="Icon">
          <path d={svgPaths.p1efd34f0} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p3acfb280} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p1c3dce80} fill="var(--fill-0, white)" id="Vector_3" />
          <path d={svgPaths.p17ac7700} fill="var(--fill-0, white)" id="Vector_4" />
        </g>
        <defs>
          <clipPath id="clip0_2122_4013">
            <rect fill="white" height="11" width="17" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute h-[11px] left-[25px] top-0 w-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 11">
        <g clipPath="url(#clip0_2122_3998)" id="Icon">
          <path d={svgPaths.p19f83200} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p34f60f80} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p332fbc00} fill="var(--fill-0, white)" id="Vector_3" />
        </g>
        <defs>
          <clipPath id="clip0_2122_3998">
            <rect fill="white" height="11" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container7() {
  return <div className="bg-white h-[7px] rounded-[1.2px] shrink-0 w-[17px]" data-name="Container" />;
}

function Container6() {
  return (
    <div className="absolute content-stretch flex h-[11px] items-center left-0 pl-[2.8px] pr-[0.8px] py-[0.8px] rounded-[2.5px] top-0 w-[22px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(255,255,255,0.4)] border-solid inset-0 pointer-events-none rounded-[2.5px]" />
      <Container7 />
    </div>
  );
}

function Container8() {
  return <div className="absolute bg-[rgba(255,255,255,0.4)] h-[4px] left-[23px] rounded-[1px] top-[3.5px] w-[2px]" data-name="Container" />;
}

function Container5() {
  return (
    <div className="absolute h-[11px] left-[49px] top-0 w-[22px]" data-name="Container">
      <Container6 />
      <Container8 />
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[11px] relative shrink-0 w-[71px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon />
        <Icon1 />
        <Container5 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex h-[44px] items-center justify-between left-0 pt-[12px] px-[24px] right-0 top-0" data-name="Container">
      <Text />
      <Container4 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d="M12.5 15L7.5 10L12.5 5" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="relative rounded-[26843500px] shrink-0 size-[36px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[8px] relative size-full">
        <Icon2 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute content-stretch flex h-[40px] items-center justify-between left-0 pl-[20px] pr-[346px] pt-[4px] right-0 top-[44px]" data-name="Container">
      <Button />
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[32px] left-0 not-italic text-[24px] text-white top-[-0.4px] whitespace-nowrap">Eligible Grants</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[14px] text-[rgba(255,255,255,0.8)] top-[0.6px] whitespace-nowrap">{`Government subsidies & B40 eligibility`}</p>
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] h-[122px] items-start left-0 pt-[12px] px-[30px] right-0 top-[84px]" data-name="Container">
      <Heading />
      <Paragraph />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[174px] relative shrink-0 w-full" style={{ backgroundImage: "linear-gradient(167.377deg, rgb(0, 89, 189) 28.712%, rgb(23, 123, 175) 91.772%)" }} data-name="Container">
      <Container3 />
      <Container9 />
      <Container10 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="Icon">
          <path d={svgPaths.p1b228440} id="Vector" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container14() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon3 />
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[21px] relative shrink-0 w-full" data-name="Heading 2">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-0 not-italic text-[#0f172a] text-[14px] top-[-0.4px] tracking-[-0.2px] whitespace-nowrap">MyDigital ID Verified</p>
    </div>
  );
}

function Container17() {
  return <div className="bg-[#0055d6] rounded-[2.5px] shrink-0 size-[5px]" data-name="Container" />;
}

function Text1() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[87.75px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] left-0 not-italic text-[#0055d6] text-[11px] top-[0.6px] whitespace-nowrap">Identity Secured</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex gap-[6px] h-[16.5px] items-center relative shrink-0 w-full" data-name="Container">
      <Container17 />
      <Text1 />
    </div>
  );
}

function Container15() {
  return (
    <div className="flex-[288.4_0_0] h-[40.5px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[3px] items-start relative size-full">
        <Heading1 />
        <Container16 />
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[40.5px] items-center left-[16.8px] right-[16.8px] top-[14.8px]" data-name="Container">
      <Container14 />
      <Container15 />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute bg-white h-[70.1px] left-[20px] rounded-[12px] shadow-[4px_4px_10px_0px_rgba(0,0,0,0.05)] top-[20px] w-[362px]" data-name="Container">
      <Container13 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[19.5px] left-[4px] right-0 top-0" data-name="Paragraph">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[19.5px] left-0 not-italic text-[#64748b] text-[13px] top-[0.6px] whitespace-nowrap">Total Available Aid</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[42px] left-[4px] not-italic right-0 top-[25.5px] whitespace-nowrap" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[42px] left-0 text-[#0f172a] text-[28px] top-0 tracking-[-0.6px]">RM 200</p>
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[19.5px] left-[108px] text-[#64748b] text-[10px] top-[14.4px]">（this month)</p>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute h-[67.5px] left-[32px] top-[120px] w-[362px]" data-name="Container">
      <Paragraph1 />
      <Paragraph2 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="absolute h-[19.5px] left-[4px] top-0 w-[358px]" data-name="Heading 3">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[19.5px] left-0 not-italic text-[#64748b] text-[13px] top-[0.6px] tracking-[0.6px] uppercase whitespace-nowrap">Ready to Claim</p>
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="Icon">
          <path d="M18 3V33" id="Vector" stroke="var(--stroke-0, #FDDC00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <path d={svgPaths.p3fce8000} id="Vector_2" stroke="var(--stroke-0, #FDDC00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[40px] relative shrink-0 w-[36px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pt-[4px] relative size-full">
        <Icon4 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="absolute h-[25.5px] left-0 top-0 w-[214.4px]" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[25.5px] left-0 not-italic text-[#0f172a] text-[17px] top-[-0.4px] tracking-[-0.3px] whitespace-nowrap">STR Phase 2</p>
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute h-[19.5px] left-0 top-[32.5px] w-[214.4px]" data-name="Container">
      <div className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-0 not-italic text-[#64748b] text-[13px] top-[0.6px] whitespace-nowrap">
        <p className="leading-[19.5px] mb-0">Based on your income level</p>
        <p className="leading-[19.5px]">​</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute h-[18.2px] left-0 top-[62px] w-[214.4px]" data-name="Container">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18.2px] left-0 not-italic text-[#0055d6] text-[13px] top-[-5px] whitespace-nowrap">RM 200 • Verified by B40 Token</p>
    </div>
  );
}

function Container23() {
  return (
    <div className="flex-[274.4_0_0] h-[80.2px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container24 />
        <Container25 />
        <Container26 />
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex gap-[14px] h-[103px] items-start left-[18.2px] top-[20.2px] w-[324px]" data-name="Container">
      <Container22 />
      <Container23 />
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute h-[19.5px] left-[49px] top-[-9.75px] w-[214.4px]" data-name="Container">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#64748b] text-[10px] top-[-3px] whitespace-nowrap">Expected payout: May 2026</p>
    </div>
  );
}

function PlaceholderForLayakPage() {
  return (
    <div className="absolute h-[49px] left-[18.2px] top-[115.95px] w-[324px]" data-name="Placeholder for LayakPage">
      <Container27 />
    </div>
  );
}

function Container28() {
  return (
    <div className="absolute border-[#10b981] border-[0.8px] border-solid h-[22.6px] left-[288.55px] rounded-[6px] top-[18px] w-[53.85px]" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[15px] left-[8px] not-italic text-[#10b981] text-[10px] top-[2.8px] tracking-[0.4px] whitespace-nowrap">READY</p>
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute bg-[#0055d6] h-[49px] left-[18.2px] rounded-[12px] top-[134.2px] w-[324px]" data-name="Button">
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[22.5px] left-[162.34px] not-italic text-[15px] text-center text-white top-[11.55px] whitespace-nowrap">Apply Now</p>
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute bg-white border-[#bedcff] border-[0.8px] border-solid h-[209px] left-0 rounded-[16px] shadow-[0px_2px_12px_0px_rgba(0,85,214,0.08),0px_1px_3px_0px_rgba(0,0,0,0.06)] top-[37.4px] w-[362px]" data-name="Container">
      <Container21 />
      <PlaceholderForLayakPage />
      <Container28 />
      <Button1 />
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute h-[223.8px] left-[20px] top-[217.6px] w-[362px]" data-name="Container">
      <Heading2 />
      <Container20 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="absolute h-[19.5px] left-[4px] top-0 w-[358px]" data-name="Heading 3">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[19.5px] left-0 not-italic text-[#94a3b8] text-[13px] top-[0.6px] tracking-[0.6px] uppercase whitespace-nowrap">Pending</p>
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Icon">
          <path d={svgPaths.p2073a200} id="Vector" stroke="var(--stroke-0, #FDDC00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M10.6667 13.3333H21.3333" id="Vector_2" stroke="var(--stroke-0, #FDDC00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d="M10.6667 24H21.3333" id="Vector_3" stroke="var(--stroke-0, #FDDC00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d={svgPaths.p3964ed80} id="Vector_4" stroke="var(--stroke-0, #FDDC00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
          <path d={svgPaths.p3efdb280} id="Vector_5" stroke="var(--stroke-0, #FDDC00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container32() {
  return (
    <div className="h-[36px] opacity-70 relative shrink-0 w-[32px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pt-[4px] relative size-full">
        <Icon5 />
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute h-[24px] left-0 top-0 w-[212.4px]" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-0 not-italic text-[#334155] text-[16px] top-[-0.6px] tracking-[-0.3px] whitespace-nowrap">Bantuan Sekolah</p>
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute h-[19.5px] left-0 top-[30px] w-[212.4px]" data-name="Container">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#64748b] text-[13px] top-[0.6px] whitespace-nowrap">Requires student ID verification</p>
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute h-[16.8px] left-0 top-[57.5px] w-[212.4px]" data-name="Container">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.8px] left-0 not-italic text-[#94a3b8] text-[12px] top-[-0.2px] whitespace-nowrap">Verifying your eligibility...</p>
    </div>
  );
}

function Container33() {
  return (
    <div className="flex-[282.4_0_0] h-[74.3px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container34 />
        <Container35 />
        <Container36 />
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute content-stretch flex gap-[14px] h-[74.3px] items-start left-[16px] top-[18px] w-[328.4px]" data-name="Container">
      <Container32 />
      <Container33 />
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute bg-[#e4e4e4] border-[#cbd5e1] border-[0.8px] border-solid h-[44.6px] left-[16px] rounded-[12px] top-[106.3px] w-[328.4px]" data-name="Button">
      <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-[164.29px] not-italic text-[#64748b] text-[14px] text-center top-[10.6px] whitespace-nowrap">Upload</p>
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute border-[#e0c300] border-[0.8px] border-solid h-[22.6px] left-[279px] rounded-[6px] top-[16px] w-[65.4px]" data-name="Container">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[15px] left-[8px] not-italic text-[#e0c300] text-[10px] top-[2.8px] tracking-[0.4px] whitespace-nowrap">PENDING</p>
    </div>
  );
}

function Container30() {
  return (
    <div className="absolute bg-white border-[#e2e8f0] border-[0.8px] border-solid h-[170.5px] left-0 rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.04)] top-[37.5px] w-[362px]" data-name="Container">
      <Container31 />
      <Button2 />
      <Container37 />
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute h-[208px] left-[20px] top-[481.4px] w-[362px]" data-name="Container">
      <Heading3 />
      <Container30 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M8 5.33333V2.66667H5.33333" id="Vector" stroke="var(--stroke-0, #78350F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p1ed63c00} id="Vector_2" stroke="var(--stroke-0, #78350F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M1.33333 9.33333H2.66667" id="Vector_3" stroke="var(--stroke-0, #78350F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M13.3333 9.33333H14.6667" id="Vector_4" stroke="var(--stroke-0, #78350F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M10 8.66667V10" id="Vector_5" stroke="var(--stroke-0, #78350F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M6 8.66667V10" id="Vector_6" stroke="var(--stroke-0, #78350F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Text2() {
  return (
    <div className="flex-[1_0_0] h-[38.4px] min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[0] left-0 not-italic text-[#78350f] text-[0px] top-[-0.4px] w-[307px]">
          <span className="leading-[19.2px] text-[12px]">AI Advisor:</span>
          <span className="font-['Inter:Regular',sans-serif] font-normal leading-[19.2px] text-[12px]">{` Claiming STR Phase 2 will fully fund your 'Education' pool for this month.`}</span>
        </p>
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="content-stretch flex gap-[6px] h-[38.4px] items-center relative shrink-0 w-full" data-name="Paragraph">
      <Icon6 />
      <Text2 />
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute bg-[#fffbe5] content-stretch flex flex-col h-[68px] items-start left-[20px] pb-[0.8px] pt-[14.8px] px-[16.8px] rounded-[12px] top-[713.4px] w-[362px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(0,85,214,0.08)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Paragraph3 />
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[824px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="absolute bg-[#ecf2fe] h-[97px] left-[17px] rounded-[16px] top-[105px] w-[362px]" />
      <Container12 />
      <Container18 />
      <Container19 />
      <Container29 />
      <Container38 />
    </div>
  );
}

function Icon7() {
  return (
    <div className="h-[15.012px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[6.67%_4.76%]" data-name="Vector">
        <div className="absolute inset-[-7.69%_-5.26%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.0127 15.0123">
            <path d={svgPaths.p248e7f00} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00143" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="h-[15.012px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon7 />
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="absolute content-stretch flex flex-col h-[13.012px] items-start left-[3px] pt-[-1px] px-[-1px] top-[3px] w-[19.013px]" data-name="Container">
      <Container44 />
    </div>
  );
}

function Icon8() {
  return (
    <div className="h-[18.013px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[5.56%_5%]" data-name="Vector">
        <div className="absolute inset-[-6.25%_-5.56%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.0007 18.0118">
            <path d={svgPaths.p3ec5c940} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00069" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex flex-col h-[18.013px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon8 />
    </div>
  );
}

function Container45() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16.013px] items-start left-[3px] pt-[-1px] px-[-1px] top-[4.99px] w-[18px]" data-name="Container">
      <Container46 />
    </div>
  );
}

function Container42() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container43 />
      <Container45 />
    </div>
  );
}

function Container41() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container42 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Home</p>
    </div>
  );
}

function Container47() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[22.1px] top-[36px] w-[33px]" data-name="Container">
      <Paragraph4 />
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute h-[60px] left-0 opacity-60 top-0 w-[77.2px]" data-name="Button">
      <Container41 />
      <Container47 />
    </div>
  );
}

function Icon9() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[12.5%_6.25%]" data-name="Vector">
        <div className="absolute inset-[-16.68%_-7.14%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.0234 8.00156">
            <path d={svgPaths.p2981c9c0} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00156" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon9 />
    </div>
  );
}

function Container50() {
  return (
    <div className="absolute content-stretch flex flex-col h-[6px] items-start left-[1.99px] pt-[-1px] px-[-1px] top-[15px] w-[14.025px]" data-name="Container">
      <Container51 />
    </div>
  );
}

function Icon10() {
  return (
    <div className="h-[10px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10%]" data-name="Vector">
        <div className="absolute inset-[-12.52%_-12.48%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.0225 10.0025">
            <path d={svgPaths.p1f688a70} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.0025" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="h-[10px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon10 />
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="absolute content-stretch flex flex-col h-[8px] items-start left-[4.99px] pt-[-1px] px-[-1px] top-[3px] w-[8.025px]" data-name="Container">
      <Container53 />
    </div>
  );
}

function Icon11() {
  return (
    <div className="h-[7.875px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[12.71%_20%]" data-name="Vector">
        <div className="absolute inset-[-17.06%_-33.3%_-17.05%_-33.31%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.01065 7.87685">
            <path d={svgPaths.pc2af800} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00306" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container55() {
  return (
    <div className="h-[7.875px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon11 />
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="absolute content-stretch flex flex-col h-[5.875px] items-start left-[19px] pt-[-1px] px-[-1px] top-[15.13px] w-[3.013px]" data-name="Container">
      <Container55 />
    </div>
  );
}

function Icon12() {
  return (
    <div className="h-[9.762px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10.26%_19.97%]" data-name="Vector">
        <div className="absolute inset-[-12.9%_-33.25%_-12.9%_-33.26%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.01285 9.76215">
            <path d={svgPaths.p10a2aa00} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00212" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container57() {
  return (
    <div className="h-[9.762px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon12 />
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="absolute content-stretch flex flex-col h-[7.763px] items-start left-[16px] pt-[-1px] px-[-1px] top-[3.13px] w-[3.013px]" data-name="Container">
      <Container57 />
    </div>
  );
}

function Container49() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container50 />
      <Container52 />
      <Container54 />
      <Container56 />
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container49 />
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Pool</p>
    </div>
  );
}

function Container58() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[26.55px] top-[36px] w-[24.087px]" data-name="Container">
      <Paragraph5 />
    </div>
  );
}

function Button4() {
  return (
    <div className="absolute h-[60px] left-[77.2px] opacity-60 top-0 w-[77.2px]" data-name="Button">
      <Container48 />
      <Container58 />
    </div>
  );
}

function Icon13() {
  return (
    <div className="h-[22.025px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[4.54%_5.56%]" data-name="Vector">
        <div className="absolute inset-[-5%_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.001 22.024">
            <path d={svgPaths.pd0b4280} id="Vector" stroke="var(--stroke-0, #005AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00098" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="content-stretch flex flex-col h-[22.025px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon13 />
    </div>
  );
}

function Container61() {
  return (
    <div className="content-stretch flex flex-col h-[20.025px] items-start pt-[-1px] px-[-1px] relative shrink-0 w-full" data-name="Container">
      <Container62 />
    </div>
  );
}

function Container60() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start pt-[1.987px] px-[4px] relative size-full">
          <Container61 />
        </div>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container60 />
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[#005aff] text-[12px] text-center whitespace-nowrap">Layak</p>
    </div>
  );
}

function Container63() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[23.2px] top-[36px] w-[30.8px]" data-name="Container">
      <Paragraph6 />
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute h-[60px] left-[154.4px] top-0 w-[77.2px]" data-name="Button">
      <Container59 />
      <Container63 />
    </div>
  );
}

function Icon14() {
  return (
    <div className="h-[12px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[8.33%_4.55%]" data-name="Vector">
        <div className="absolute inset-[-10%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.0119 12.0006">
            <path d={svgPaths.p2bce8880} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00057" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="h-[12px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon14 />
      </div>
    </div>
  );
}

function Container66() {
  return (
    <div className="absolute content-stretch flex flex-col h-[10px] items-start left-[2.31px] pt-[-1px] px-[-1px] top-[7px] w-[20.013px]" data-name="Container">
      <Container67 />
    </div>
  );
}

function Icon15() {
  return (
    <div className="h-[8.012px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[12.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.0125 8.0125">
            <path d={svgPaths.p31061680} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00312" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container69() {
  return (
    <div className="content-stretch flex flex-col h-[8.012px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon15 />
    </div>
  );
}

function Container68() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[16.31px] pt-[-1px] px-[-1px] size-[6.013px] top-[7px]" data-name="Container">
      <Container69 />
    </div>
  );
}

function Container65() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container66 />
      <Container68 />
    </div>
  );
}

function Container64() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container65 />
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Analytics</p>
    </div>
  );
}

function Container70() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[14.16px] top-[36px] w-[48.875px]" data-name="Container">
      <Paragraph7 />
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute h-[60px] left-[231.6px] opacity-60 top-0 w-[77.2px]" data-name="Button">
      <Container64 />
      <Container70 />
    </div>
  );
}

function Icon16() {
  return (
    <div className="h-[22.025px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[4.55%_4.99%]" data-name="Vector">
        <div className="absolute inset-[-5%_-5.55%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.0266 22.0234">
            <path d={svgPaths.pd2c3980} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00063" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container74() {
  return (
    <div className="content-stretch flex flex-col h-[22.025px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon16 />
    </div>
  );
}

function Container73() {
  return (
    <div className="absolute content-stretch flex flex-col h-[20.025px] items-start left-[2.97px] pl-[-0.987px] pr-[-0.988px] pt-[-1px] top-[1.99px] w-[18.05px]" data-name="Container">
      <Container74 />
    </div>
  );
}

function Icon17() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[12.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
            <path d={svgPaths.p1e531d00} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container76() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon17 />
    </div>
  );
}

function Container75() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[9px] pt-[-1px] px-[-1px] size-[6px] top-[9px]" data-name="Container">
      <Container76 />
    </div>
  );
}

function Container72() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container73 />
      <Container75 />
    </div>
  );
}

function Container71() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container72 />
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Profile</p>
    </div>
  );
}

function Container77() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[21.05px] top-[36px] w-[35.1px]" data-name="Container">
      <Paragraph8 />
    </div>
  );
}

function Button7() {
  return (
    <div className="absolute h-[60px] left-[308.8px] opacity-60 top-0 w-[77.2px]" data-name="Button">
      <Container71 />
      <Container77 />
    </div>
  );
}

function Container40() {
  return (
    <div className="h-[60px] relative shrink-0 w-full" data-name="Container">
      <Button3 />
      <Button4 />
      <Button5 />
      <Button6 />
      <Button7 />
    </div>
  );
}

function Container39() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[84px] items-start pt-[12px] px-[8px] relative shadow-[0px_-2px_12px_0px_rgba(0,0,0,0.04)] shrink-0 w-[402px]" data-name="Container">
      <Container40 />
    </div>
  );
}

function LayakPage() {
  return (
    <div className="bg-gradient-to-b content-stretch flex flex-col from-[#f5f7fa] h-[998px] items-start relative shrink-0 to-white w-full" data-name="LayakPage">
      <Container2 />
      <Container11 />
      <Container39 />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col h-[1073px] items-start left-0 overflow-clip top-0 w-[402px]" data-name="Container">
      <LayakPage />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute bottom-0 left-0 overflow-clip top-0 w-[402px]" data-name="Container">
      <Container1 />
    </div>
  );
}

export default function App() {
  return (
    <div className="bg-gradient-to-b from-[#bedcff] relative size-full to-[#f5f7fa] to-[28.846%]" data-name="App">
      <Container />
    </div>
  );
}