"use client";
import dynamic from 'next/dynamic';
import React from 'react';

const HandwritingNote = dynamic(() => import('./HandwritingNote'), { ssr: false });

interface HandwritingNoteSectionProps {
  noteData?: string;
  label?: string;
  section: string;
  pageId: string | number;
}

const HandwritingNoteSection: React.FC<HandwritingNoteSectionProps> = ({ noteData, label, section, pageId }) => {
  return <HandwritingNote noteData={noteData} label={label} section={section} pageId={pageId} />;
};

export default HandwritingNoteSection;
