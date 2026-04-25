import svgPaths from "./svg-18kxyjcaum";

function Text() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[39.475px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] left-0 not-italic text-[#101828] text-[15px] top-[-1.4px] tracking-[-0.24px] whitespace-nowrap">12:30</p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[11px] relative shrink-0 w-[17px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 11">
        <g clipPath="url(#clip0_2109_1581)" id="Icon">
          <path d={svgPaths.p14a29800} fill="var(--fill-0, #101828)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2109_1581">
            <rect fill="white" height="11" width="17" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[11px] relative shrink-0 w-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 11">
        <g clipPath="url(#clip0_2109_1551)" id="Icon">
          <path d={svgPaths.p18021a00} fill="var(--fill-0, #101828)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2109_1551">
            <rect fill="white" height="11" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container5() {
  return <div className="bg-[#101828] h-[7px] rounded-[1.2px] shrink-0 w-[17px]" data-name="Container" />;
}

function Container4() {
  return (
    <div className="flex-[1_0_0] h-[11px] min-w-px relative rounded-[2.5px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.8px] border-[rgba(16,24,40,0.4)] border-solid inset-0 pointer-events-none rounded-[2.5px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center pl-[2.8px] pr-[0.8px] py-[0.8px] relative size-full">
          <Container5 />
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[11px] relative shrink-0 w-[71px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Icon />
        <Icon1 />
        <Container4 />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex h-[44px] items-center justify-between left-0 pt-[12px] px-[20px] top-0 w-[402px]" data-name="Container">
      <Text />
      <Container3 />
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Heading 1">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[32px] left-0 not-italic text-[#101828] text-[24px] top-[-0.4px] whitespace-nowrap">Profile</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] top-[0.6px] whitespace-nowrap">Manage your account settings</p>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[60px] relative shrink-0 w-[200.463px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <Heading />
        <Paragraph />
      </div>
    </div>
  );
}

function LogoutIcon() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="LogoutIcon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="LogoutIcon">
          <path d={svgPaths.p28be6180} id="Vector" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66666" />
          <path d={svgPaths.p90254e0} id="Vector_2" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66666" />
          <path d="M17.5 9.99999H7.5" id="Vector_3" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66666" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white relative rounded-[20px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.1)] shrink-0 size-[40px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[10px] relative size-full">
        <LogoutIcon />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex h-[88px] items-start justify-between left-0 pt-[28px] px-[20px] top-[44px] w-[402px]" data-name="Container">
      <Container7 />
      <Button />
    </div>
  );
}

function Container9() {
  return <div className="absolute h-[111.1px] left-[162.9px] top-0 w-[199.1px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 199.1 111.1\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -15.712 -28.157 0 199.1 0)\\'><stop stop-color=\\'rgba(255,255,255,0.1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(128,128,128,0.05)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }} data-name="Container" />;
}

function Text1() {
  return (
    <div className="h-[36px] relative shrink-0 w-[17.95px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[36px] left-0 not-italic text-[24px] text-white top-[-0.8px] whitespace-nowrap">A</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="bg-[rgba(255,255,255,0.2)] relative rounded-[32px] shrink-0 size-[64px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[23.025px] relative size-full">
        <Text1 />
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[20px] text-white top-[-0.4px] whitespace-nowrap">Amanda</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#dbeafe] text-[14px] top-[0.6px] whitespace-nowrap">013-865 XXXXX</p>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[48px] relative shrink-0 w-[125.088px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Paragraph1 />
        <Paragraph2 />
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute content-stretch flex gap-[16px] h-[64px] items-center left-[29px] top-[29px] w-[304px]" data-name="Container">
      <Container11 />
      <Container12 />
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[32px] left-[50.56px] not-italic text-[24px] text-center text-white top-[-0.4px] whitespace-nowrap">2</p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#dbeafe] text-[10px] text-center">Active Pools</p>
    </div>
  );
}

function Container14() {
  return (
    <div className="flex-[101.063_0_0] h-[48px] min-w-px relative" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.2)] border-r-[0.8px] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[0.8px] relative size-full">
        <Paragraph3 />
        <Paragraph4 />
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[32px] left-[50.61px] not-italic text-[24px] text-center text-white top-[-0.4px] whitespace-nowrap">24</p>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#dbeafe] text-[10px] text-center">Transactions</p>
    </div>
  );
}

function Container15() {
  return (
    <div className="flex-[101.863_0_0] h-[48px] min-w-px relative" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.2)] border-l-[0.8px] border-r-[0.8px] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[0.8px] relative size-full">
        <Paragraph5 />
        <Paragraph6 />
      </div>
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[32px] left-[50.39px] not-italic text-[24px] text-center text-white top-[-0.4px] whitespace-nowrap">5</p>
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Regular',sans-serif] font-normal leading-[16px] min-w-px not-italic relative text-[#dbeafe] text-[10px] text-center">Family Members</p>
    </div>
  );
}

function Container16() {
  return (
    <div className="flex-[101.063_0_0] h-[48px] min-w-px relative" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.2)] border-l-[0.8px] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pl-[0.8px] relative size-full">
        <Paragraph7 />
        <Paragraph8 />
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex h-[64.8px] items-start left-[29px] pr-[0.013px] pt-[16.8px] top-[109px] w-[304px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.2)] border-solid border-t-[0.8px] inset-0 pointer-events-none" />
      <Container14 />
      <Container15 />
      <Container16 />
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute h-[202px] left-[20px] overflow-clip rounded-[24px] shadow-[0px_8px_24px_0px_rgba(0,90,255,0.15)] top-[152px] w-[362px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 362 202\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -14.284 -25.597 0 181 101)\\'><stop stop-color=\\'rgba(6,65,135,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(0,89,189,1)\\' offset=\\'0.47\\'/><stop stop-color=\\'rgba(10,110,182,1)\\' offset=\\'0.74\\'/><stop stop-color=\\'rgba(20,131,174,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }} data-name="Container">
      <Container9 />
      <Container10 />
      <Container13 />
    </div>
  );
}

function IconAccountSettings() {
  return (
    <div className="h-[40px] overflow-clip relative shrink-0 w-full" data-name="IconAccountSettings">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <path d={svgPaths.p84d4a00} fill="var(--fill-0, #ECF2FE)" id="Vector" />
      </svg>
      <div className="absolute inset-[55%_35.83%_32.5%_35%]" data-name="Vector">
        <div className="absolute inset-[-16.67%_-7.14%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3334 6.66667">
            <path d={svgPaths.p1d681270} id="Vector" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[30%_42.08%_53.33%_41.25%]" data-name="Vector">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.33337 8.33337">
            <path d={svgPaths.p3968f800} id="Vector" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <IconAccountSettings />
      </div>
    </div>
  );
}

function Paragraph9() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[#101828] text-[14px] top-[0.6px] whitespace-nowrap">Account Settings</p>
    </div>
  );
}

function Paragraph10() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Medium',sans-serif] font-medium leading-[16px] min-w-px not-italic relative text-[#6a7282] text-[12px]">Update your profile</p>
    </div>
  );
}

function Container20() {
  return (
    <div className="h-[38px] relative shrink-0 w-[118.912px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Paragraph9 />
        <Paragraph10 />
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[40px] relative shrink-0 w-[170.913px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container19 />
        <Container20 />
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <div className="h-[24px] relative shrink-0 w-[5.912px]" data-name="Chevron">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[3px] not-italic text-[#99a1af] text-[16px] text-center top-[-0.6px] whitespace-nowrap">›</p>
      </div>
    </div>
  );
}

function SettingsItem() {
  return (
    <div className="bg-white h-[72px] relative rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-[362px]" data-name="SettingsItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[16px] relative size-full">
        <Container18 />
        <Chevron />
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p25877f40} id="Vector" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1c3efea0} id="Vector_2" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function IconNotifications() {
  return (
    <div className="bg-[#ecf2fe] h-[40px] relative rounded-[14px] shrink-0 w-full" data-name="IconNotifications">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[10px] relative size-full">
          <Icon2 />
        </div>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <IconNotifications />
      </div>
    </div>
  );
}

function Paragraph11() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[#101828] text-[14px] top-[0.6px] whitespace-nowrap">Notifications</p>
    </div>
  );
}

function Paragraph12() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Medium',sans-serif] font-medium leading-[16px] min-w-px not-italic relative text-[#6a7282] text-[12px]">Manage alerts</p>
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[38px] relative shrink-0 w-[88.1px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Paragraph11 />
        <Paragraph12 />
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="h-[40px] relative shrink-0 w-[140.1px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container22 />
        <Container23 />
      </div>
    </div>
  );
}

function Chevron1() {
  return (
    <div className="h-[24px] relative shrink-0 w-[5.912px]" data-name="Chevron">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[3px] not-italic text-[#99a1af] text-[16px] text-center top-[-0.6px] whitespace-nowrap">›</p>
      </div>
    </div>
  );
}

function SettingsItem1() {
  return (
    <div className="bg-white h-[72px] relative rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-[362px]" data-name="SettingsItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[16px] relative size-full">
        <Container21 />
        <Chevron1 />
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[17px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
        <g clipPath="url(#clip0_2109_1576)" id="Icon">
          <path d={svgPaths.pb666180} fill="var(--fill-0, #0055D6)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_2109_1576">
            <rect fill="white" height="17" width="17" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function IconPrivacy() {
  return (
    <div className="bg-[#ecf2fe] h-[40px] relative rounded-[14px] shrink-0 w-full" data-name="IconPrivacy">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[11.5px] relative size-full">
          <Icon3 />
        </div>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <IconPrivacy />
      </div>
    </div>
  );
}

function Paragraph13() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[#101828] text-[14px] top-[0.6px] whitespace-nowrap">{`Privacy & Security`}</p>
    </div>
  );
}

function Paragraph14() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#6a7282] text-[12px] whitespace-nowrap">Keep your account safe</p>
    </div>
  );
}

function Container26() {
  return (
    <div className="flex-[1_0_0] h-[38px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Paragraph13 />
        <Paragraph14 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="h-[40px] relative shrink-0 w-[187px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container25 />
        <Container26 />
      </div>
    </div>
  );
}

function Chevron2() {
  return (
    <div className="h-[24px] relative shrink-0 w-[5.912px]" data-name="Chevron">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[3px] not-italic text-[#99a1af] text-[16px] text-center top-[-0.6px] whitespace-nowrap">›</p>
      </div>
    </div>
  );
}

function SettingsItem2() {
  return (
    <div className="bg-white h-[72px] relative rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-[362px]" data-name="SettingsItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[16px] relative size-full">
        <Container24 />
        <Chevron2 />
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[19px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
        <g id="Icon">
          <path d={svgPaths.p2c1b2700} fill="var(--fill-0, #0055D6)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function IconPayment() {
  return (
    <div className="bg-[#ecf2fe] h-[40px] relative rounded-[14px] shrink-0 w-full" data-name="IconPayment">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[10.5px] relative size-full">
          <Icon4 />
        </div>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <IconPayment />
      </div>
    </div>
  );
}

function Paragraph15() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[#101828] text-[14px] top-[0.6px] whitespace-nowrap">Payment Methods</p>
    </div>
  );
}

function Paragraph16() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#6a7282] text-[12px] whitespace-nowrap">{`Manage cards & banks`}</p>
    </div>
  );
}

function Container29() {
  return (
    <div className="flex-[1_0_0] h-[38px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Paragraph15 />
        <Paragraph16 />
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="h-[40px] relative shrink-0 w-[181.988px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container28 />
        <Container29 />
      </div>
    </div>
  );
}

function Chevron3() {
  return (
    <div className="h-[24px] relative shrink-0 w-[5.912px]" data-name="Chevron">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[3px] not-italic text-[#99a1af] text-[16px] text-center top-[-0.6px] whitespace-nowrap">›</p>
      </div>
    </div>
  );
}

function SettingsItem3() {
  return (
    <div className="bg-white h-[72px] relative rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-[362px]" data-name="SettingsItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[16px] relative size-full">
        <Container27 />
        <Chevron3 />
      </div>
    </div>
  );
}

function IconHelp() {
  return (
    <div className="h-[40px] overflow-clip relative shrink-0 w-full" data-name="IconHelp">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <path d={svgPaths.p84d4a00} fill="var(--fill-0, #ECF2FE)" id="Vector" />
      </svg>
      <div className="absolute inset-[32.5%_40%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 14">
          <path d={svgPaths.p35c0c300} fill="var(--fill-0, #0055D6)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <IconHelp />
      </div>
    </div>
  );
}

function Paragraph17() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[#101828] text-[14px] top-[0.6px] whitespace-nowrap">{`Help & Support`}</p>
    </div>
  );
}

function Paragraph18() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Medium',sans-serif] font-medium leading-[16px] min-w-px not-italic relative text-[#6a7282] text-[12px]">Get assistance</p>
    </div>
  );
}

function Container32() {
  return (
    <div className="flex-[1_0_0] h-[38px] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Paragraph17 />
        <Paragraph18 />
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="h-[40px] relative shrink-0 w-[155.125px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container31 />
        <Container32 />
      </div>
    </div>
  );
}

function Chevron4() {
  return (
    <div className="h-[24px] relative shrink-0 w-[5.912px]" data-name="Chevron">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[3px] not-italic text-[#99a1af] text-[16px] text-center top-[-0.6px] whitespace-nowrap">›</p>
      </div>
    </div>
  );
}

function SettingsItem4() {
  return (
    <div className="bg-white h-[72px] relative rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-[362px]" data-name="SettingsItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[16px] relative size-full">
        <Container30 />
        <Chevron4 />
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.ped54800} id="Vector" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p3b27f100} id="Vector_2" stroke="var(--stroke-0, #0055D6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function IconAppSettings() {
  return (
    <div className="bg-[#ecf2fe] h-[40px] relative rounded-[14px] shrink-0 w-full" data-name="IconAppSettings">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[10px] relative size-full">
          <Icon5 />
        </div>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <IconAppSettings />
      </div>
    </div>
  );
}

function Paragraph19() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[20px] left-0 not-italic text-[#101828] text-[14px] top-[0.6px] whitespace-nowrap">App Settings</p>
    </div>
  );
}

function Paragraph20() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="flex-[1_0_0] font-['Inter:Medium',sans-serif] font-medium leading-[16px] min-w-px not-italic relative text-[#6a7282] text-[12px]">Preferences</p>
    </div>
  );
}

function Container35() {
  return (
    <div className="h-[38px] relative shrink-0 w-[89.088px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Paragraph19 />
        <Paragraph20 />
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="h-[40px] relative shrink-0 w-[141.088px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Container34 />
        <Container35 />
      </div>
    </div>
  );
}

function Chevron5() {
  return (
    <div className="h-[24px] relative shrink-0 w-[5.912px]" data-name="Chevron">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[3px] not-italic text-[#99a1af] text-[16px] text-center top-[-0.6px] whitespace-nowrap">›</p>
      </div>
    </div>
  );
}

function SettingsItem5() {
  return (
    <div className="bg-white h-[72px] relative rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-[362px]" data-name="SettingsItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[16px] relative size-full">
        <Container33 />
        <Chevron5 />
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[512px] items-start left-0 pt-[20px] px-[20px] top-[354px] w-[402px]" data-name="Container">
      <SettingsItem />
      <SettingsItem1 />
      <SettingsItem2 />
      <SettingsItem3 />
      <SettingsItem4 />
      <SettingsItem5 />
    </div>
  );
}

function Icon6() {
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

function Container41() {
  return (
    <div className="h-[15.012px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon6 />
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="absolute content-stretch flex flex-col h-[13.012px] items-start left-[3px] pt-[-1px] px-[-1px] top-[3px] w-[19.013px]" data-name="Container">
      <Container41 />
    </div>
  );
}

function Icon7() {
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

function Container43() {
  return (
    <div className="content-stretch flex flex-col h-[18.013px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon7 />
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16.013px] items-start left-[3px] pt-[-1px] px-[-1px] top-[4.99px] w-[18px]" data-name="Container">
      <Container43 />
    </div>
  );
}

function Container39() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container40 />
      <Container42 />
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container39 />
    </div>
  );
}

function Paragraph21() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Home</p>
    </div>
  );
}

function Container44() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[22.1px] top-[36px] w-[33px]" data-name="Container">
      <Paragraph21 />
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute h-[60px] left-0 opacity-60 top-0 w-[77.2px]" data-name="Button">
      <Container38 />
      <Container44 />
    </div>
  );
}

function Icon8() {
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

function Container48() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon8 />
    </div>
  );
}

function Container47() {
  return (
    <div className="absolute content-stretch flex flex-col h-[6px] items-start left-[1.99px] pt-[-1px] px-[-1px] top-[15px] w-[14.025px]" data-name="Container">
      <Container48 />
    </div>
  );
}

function Icon9() {
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

function Container50() {
  return (
    <div className="h-[10px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon9 />
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="absolute content-stretch flex flex-col h-[8px] items-start left-[4.99px] pt-[-1px] px-[-1px] top-[3px] w-[8.025px]" data-name="Container">
      <Container50 />
    </div>
  );
}

function Icon10() {
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

function Container52() {
  return (
    <div className="h-[7.875px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon10 />
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="absolute content-stretch flex flex-col h-[5.875px] items-start left-[19px] pt-[-1px] px-[-1px] top-[15.13px] w-[3.013px]" data-name="Container">
      <Container52 />
    </div>
  );
}

function Icon11() {
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

function Container54() {
  return (
    <div className="h-[9.762px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon11 />
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="absolute content-stretch flex flex-col h-[7.763px] items-start left-[16px] pt-[-1px] px-[-1px] top-[3.13px] w-[3.013px]" data-name="Container">
      <Container54 />
    </div>
  );
}

function Container46() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container47 />
      <Container49 />
      <Container51 />
      <Container53 />
    </div>
  );
}

function Container45() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container46 />
    </div>
  );
}

function Paragraph22() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Pool</p>
    </div>
  );
}

function Container55() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[26.55px] top-[36px] w-[24.087px]" data-name="Container">
      <Paragraph22 />
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute h-[60px] left-[77.2px] opacity-60 top-0 w-[77.2px]" data-name="Button">
      <Container45 />
      <Container55 />
    </div>
  );
}

function Icon12() {
  return (
    <div className="h-[22.025px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[4.54%_5.56%]" data-name="Vector">
        <div className="absolute inset-[-5%_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.001 22.024">
            <path d={svgPaths.pd0b4280} id="Vector" stroke="var(--stroke-0, #9CA3AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00098" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="content-stretch flex flex-col h-[22.025px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon12 />
    </div>
  );
}

function Container58() {
  return (
    <div className="content-stretch flex flex-col h-[20.025px] items-start pt-[-1px] px-[-1px] relative shrink-0 w-full" data-name="Container">
      <Container59 />
    </div>
  );
}

function Container57() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start pt-[1.987px] px-[4px] relative size-full">
          <Container58 />
        </div>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container57 />
    </div>
  );
}

function Paragraph23() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Layak</p>
    </div>
  );
}

function Container60() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[23.2px] top-[36px] w-[30.8px]" data-name="Container">
      <Paragraph23 />
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute h-[60px] left-[154.4px] opacity-60 top-0 w-[77.2px]" data-name="Button">
      <Container56 />
      <Container60 />
    </div>
  );
}

function Icon13() {
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

function Container64() {
  return (
    <div className="h-[12px] relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <Icon13 />
      </div>
    </div>
  );
}

function Container63() {
  return (
    <div className="absolute content-stretch flex flex-col h-[10px] items-start left-[2.31px] pt-[-1px] px-[-1px] top-[7px] w-[20.013px]" data-name="Container">
      <Container64 />
    </div>
  );
}

function Icon14() {
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

function Container66() {
  return (
    <div className="content-stretch flex flex-col h-[8.012px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon14 />
    </div>
  );
}

function Container65() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[16.31px] pt-[-1px] px-[-1px] size-[6.013px] top-[7px]" data-name="Container">
      <Container66 />
    </div>
  );
}

function Container62() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container63 />
      <Container65 />
    </div>
  );
}

function Container61() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container62 />
    </div>
  );
}

function Paragraph24() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#9ca3af] text-[12px] text-center whitespace-nowrap">Analytics</p>
    </div>
  );
}

function Container67() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[14.16px] top-[36px] w-[48.875px]" data-name="Container">
      <Paragraph24 />
    </div>
  );
}

function Button4() {
  return (
    <div className="absolute h-[60px] left-[231.6px] opacity-60 top-0 w-[77.2px]" data-name="Button">
      <Container61 />
      <Container67 />
    </div>
  );
}

function Icon15() {
  return (
    <div className="h-[22.025px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[4.55%_4.99%]" data-name="Vector">
        <div className="absolute inset-[-5%_-5.55%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.0266 22.0234">
            <path d={svgPaths.pd2c3980} id="Vector" stroke="var(--stroke-0, #005AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.00063" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container71() {
  return (
    <div className="content-stretch flex flex-col h-[22.025px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon15 />
    </div>
  );
}

function Container70() {
  return (
    <div className="absolute content-stretch flex flex-col h-[20.025px] items-start left-[2.97px] pl-[-0.987px] pr-[-0.988px] pt-[-1px] top-[1.99px] w-[18.05px]" data-name="Container">
      <Container71 />
    </div>
  );
}

function Icon16() {
  return (
    <div className="h-[8px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[12.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
            <path d={svgPaths.p1e531d00} id="Vector" stroke="var(--stroke-0, #005AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container73() {
  return (
    <div className="content-stretch flex flex-col h-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon16 />
    </div>
  );
}

function Container72() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[9px] pt-[-1px] px-[-1px] size-[6px] top-[9px]" data-name="Container">
      <Container73 />
    </div>
  );
}

function Container69() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container70 />
      <Container72 />
    </div>
  );
}

function Container68() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[26.6px] size-[24px] top-[8px]" data-name="Container">
      <Container69 />
    </div>
  );
}

function Paragraph25() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[#005aff] text-[12px] text-center whitespace-nowrap">Profile</p>
    </div>
  );
}

function Container74() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16px] items-start left-[21.05px] top-[36px] w-[35.1px]" data-name="Container">
      <Paragraph25 />
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute h-[60px] left-[308.8px] top-0 w-[77.2px]" data-name="Button">
      <Container68 />
      <Container74 />
    </div>
  );
}

function Container37() {
  return (
    <div className="h-[60px] relative shrink-0 w-full" data-name="Container">
      <Button1 />
      <Button2 />
      <Button3 />
      <Button4 />
      <Button5 />
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[84px] items-start left-0 pt-[12px] px-[8px] shadow-[0px_-2px_12px_0px_rgba(0,0,0,0.04)] top-[909px] w-[402px]" data-name="Container">
      <Container37 />
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="bg-[#ebf3fd] h-[1149px] overflow-clip relative shrink-0 w-full" data-name="ProfilePage">
      <Container2 />
      <Container6 />
      <Container8 />
      <Container17 />
      <Container36 />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col h-[1014px] items-start left-0 overflow-clip top-0 w-[402px]" data-name="Container">
      <ProfilePage />
    </div>
  );
}

function Container() {
  return (
    <div className="h-[1014px] relative shrink-0 w-[402px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Container1 />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="bg-gradient-to-b content-stretch flex flex-col from-[#bedcff] items-start relative size-full to-[#f5f7fa] to-[28.846%]" data-name="App">
      <Container />
    </div>
  );
}