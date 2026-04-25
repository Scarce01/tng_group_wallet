import svgPaths from "./svg-xpw7gb0ane";

function Icon() {
  return (
    <div className="absolute left-[107px] size-[20px] top-[18.2px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p25397b80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p2c4f400} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M15.8333 6.66667V11.6667" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M18.3333 9.16667H13.3333" id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

export default function Button() {
  return (
    <div className="relative rounded-[28px] shadow-[0px_4px_16px_0px_rgba(0,90,255,0.3)] size-full" style={{ backgroundImage: "linear-gradient(171.616752deg, rgb(17, 115, 178) 0%, rgb(0, 85, 214) 100%)" }} data-name="Button">
      <Icon />
      <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] left-[197px] not-italic text-[16px] text-center text-white top-[16px] whitespace-nowrap">Add Contributor</p>
    </div>
  );
}