'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import AIAssistant from './AIAssistant';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="flex w-full min-h-screen">
      {/* Left Sidebar */}
      <Sidebar
        onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
        isAssistantOpen={isAssistantOpen}
      />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </main>

      {/* Right AI Assistant */}
      <AIAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}
