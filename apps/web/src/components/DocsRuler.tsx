import React from 'react';

export const DocsRuler: React.FC = () => {
  // Standard 8.5" width ruler with 1" margins
  // Ruler is 816px wide to match the document paper exactly
  const totalInches = 8;
  const inches = Array.from({ length: totalInches + 1 }, (_, i) => i);

  return (
    <div className="w-full bg-[#f9fbfd] flex justify-center border-b border-[#dadce0] select-none py-1">
      <div className="w-[816px] h-4 bg-[#f1f3f4] relative flex items-end border-x border-[#dadce0]">
        {/* Left margin area (1 inch = 96px) */}
        <div className="absolute left-0 top-0 bottom-0 w-[72px] bg-[#e8eaed] border-r border-[#dadce0]" />
        {/* Right margin area (1 inch = 96px) */}
        <div className="absolute right-0 top-0 bottom-0 w-[72px] bg-[#e8eaed] border-l border-[#dadce0]" />

        {/* Measurement ticks and numbers */}
        <div className="w-full flex relative h-full">
          {inches.map((inch) => {
            const leftPercent = (inch / totalInches) * 100;
            return (
              <React.Fragment key={inch}>
                {/* Inch mark */}
                <div
                  className="absolute bottom-0 h-2.5 w-[1px] bg-[#80868b]"
                  style={{ left: `${leftPercent}%` }}
                />
                {inch > 0 && inch < totalInches && (
                  <span
                    className="absolute bottom-2 text-[9px] font-sans text-[#5f6368] -translate-x-1/2"
                    style={{ left: `${leftPercent}%` }}
                  >
                    {inch}
                  </span>
                )}
                {/* 1/2 inch tick */}
                {inch < totalInches && (
                  <div
                    className="absolute bottom-0 h-2 w-[1px] bg-[#9aa0a6]"
                    style={{ left: `${((inch + 0.5) / totalInches) * 100}%` }}
                  />
                )}
                {/* 1/4 inch ticks */}
                {inch < totalInches && (
                  <>
                    <div
                      className="absolute bottom-0 h-1.5 w-[1px] bg-[#dadce0]"
                      style={{ left: `${((inch + 0.25) / totalInches) * 100}%` }}
                    />
                    <div
                      className="absolute bottom-0 h-1.5 w-[1px] bg-[#dadce0]"
                      style={{ left: `${((inch + 0.75) / totalInches) * 100}%` }}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Left Indent Marker (Triangle + Rectangle marker) */}
        <div
          className="absolute top-0 w-3 -translate-x-1/2 cursor-ew-resize group z-10"
          style={{ left: '72px' }}
          title="First line indent"
        >
          <div className="w-3 h-1 bg-[#1a73e8]" />
          <div className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#1a73e8]" />
        </div>

        {/* Right Margin Marker (Triangle marker) */}
        <div
          className="absolute top-0 w-3 -translate-x-1/2 cursor-ew-resize group z-10"
          style={{ left: `${816 - 72}px` }}
          title="Right indent"
        >
          <div className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#1a73e8]" />
        </div>
      </div>
    </div>
  );
};
