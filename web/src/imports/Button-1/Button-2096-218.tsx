function Icon() {
  return (
    <div className="absolute left-[116px] size-[20px] top-[13px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d="M4.16667 10H15.8333" id="Vector" stroke="var(--stroke-0, #045BCF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 4.16667V15.8333" id="Vector_2" stroke="var(--stroke-0, #045BCF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="absolute h-[24px] left-[144px] top-[13px] w-[124.725px]" data-name="Text">
      <p className="-translate-x-1/2 absolute font-['Inter:Bold',sans-serif] font-bold leading-[24px] left-[62px] not-italic text-[#045bcf] text-[16px] text-center top-[-2.2px] whitespace-nowrap">Create New Pool</p>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[114px] top-[11px]">
      <Icon />
      <Text />
    </div>
  );
}

export default function Button() {
  return (
    <div className="bg-white border-2 border-[#045bcf] border-solid relative rounded-[28px] size-full" data-name="Button">
      <Group />
    </div>
  );
}