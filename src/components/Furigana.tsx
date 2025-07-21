import React, { useMemo } from 'react';

interface FuriganaProps {
  htmlString: string;
  className?: string;
  rtClass?: string;
  boldMain?: boolean;
}

const Furigana: React.FC<FuriganaProps> = ({ htmlString, className = '', rtClass = '', boldMain = false }) => {
  if (typeof htmlString !== 'string') return null;
  let html = htmlString;
  if (rtClass) {
    html = html.replace(/<rt>(.*?)<\/rt>/g, `<rt style=\"color:rgb(156 163 175);font-weight:normal;\" class='${rtClass} dark:text-gray-400'>$1</rt>`);
  } else {
    html = html.replace(/<rt>(.*?)<\/rt>/g, '<rt style="color:red" class="dark:text-red-400">$1</rt>');
  }
  if (boldMain) {
    html = html.replace(/<ruby>([\s\S]*?)(<rt>)/g, '<ruby><span style="color:#111 !important;font-weight:bold;" class="dark:!text-gray-100">$1</span>$2');
  }
  return (
    <span
      className={`font-[\'Noto Sans JP\'], jp-font font-bold ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Furigana;
