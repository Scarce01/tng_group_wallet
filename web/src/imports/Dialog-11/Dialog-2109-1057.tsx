import svgPaths from "./svg-9liafpvnfh";

function DialogHeader() {
  return <div className="absolute h-[28px] left-[26.2px] top-[40.2px] w-[114px]" data-name="DialogHeader" />;
}

function Icon() {
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

function Button() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[393.2px] opacity-70 rounded-[2px] size-[16px] top-[16.2px]" data-name="Button">
      <Icon />
    </div>
  );
}

function Icon1() {
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

function SuccessCircleIcon() {
  return (
    <div className="-translate-x-1/2 absolute left-[calc(50%+0.5px)] size-[77px] top-[64.2px]" data-name="SuccessCircleIcon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 77 77">
        <g id="SuccessCircleIcon">
          <path d={svgPaths.p9c22600} id="Vector" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
          <path d={svgPaths.p1ea90100} id="Vector_2" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
        </g>
      </svg>
    </div>
  );
}

export default function Dialog() {
  return (
    <div className="bg-white border-[0.8px] border-[rgba(0,0,0,0.1)] border-solid overflow-clip relative rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-full" data-name="Dialog">
      <DialogHeader />
      <Button />
      <Icon1 />
      <SuccessCircleIcon />
    </div>
  );
}