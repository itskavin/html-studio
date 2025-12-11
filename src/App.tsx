import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CodeEditor } from './components/CodeEditor';
import { Preview } from './components/Preview';
import { useCodeStore } from './store/useCodeStore';
import { Code2, FileCode, FileJson, Download, Share2 } from 'lucide-react';
import clsx from 'clsx';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [liveLink, setLiveLink] = useState<string | null>(null);
  const [editorLink, setEditorLink] = useState<string | null>(null);
  const { html, css, js, setHtml, setCss, setJs } = useCodeStore();

  // Load shared code from URL hash or edit token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editToken = params.get('e');

    const loadFromEditToken = async (token: string) => {
      try {
        const res = await fetch(`/api/share-edit/${token}`);
        if (!res.ok) throw new Error('Invalid edit token');
        const data = await res.json();
        if (data.html !== undefined) setHtml(data.html);
        if (data.css !== undefined) setCss(data.css);
        if (data.js !== undefined) setJs(data.js);
        const currentPath = window.location.pathname;
        const live = `${window.location.origin}${currentPath}`;
        const editor = `${live}?e=${token}`;
        setLiveLink(live);
        setEditorLink(editor);
        toast.success('Loaded shared code!');
        return true;
      } catch (err) {
        console.error('Failed to load shared code via edit token:', err);
        toast.error('Invalid share link');
        return false;
      }
    };

    if (editToken) {
      loadFromEditToken(editToken);
      return;
    }

    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = atob(hash);
        const data = JSON.parse(decoded);
        if (data.html !== undefined) setHtml(data.html);
        if (data.css !== undefined) setCss(data.css);
        if (data.js !== undefined) setJs(data.js);
        toast.success('Loaded shared code!');
      } catch (e) {
        console.error('Failed to load shared code:', e);
        toast.error('Invalid share link');
      }
    }
  }, [setHtml, setCss, setJs]);

  const handleDownload = () => {
    const fullHtml = `
<!DOCTYPE html>
<html>
  <head>
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${js}</script>
  </body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded index.html');
  };

  const handleShare = async () => {
    try {
      const data = { html, css, js };
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save code');
      
      const { id, editToken } = await response.json();
      const live = `${window.location.origin}/${id}`;
      const editor = `${window.location.origin}/${id}?e=${editToken}`;
      
      setLiveLink(live);
      setEditorLink(editor);

      // Update URL to editor link so the session can be restored on refresh
      window.history.replaceState({}, '', editor);

      // Copy editor link by default
      await navigator.clipboard.writeText(editor);
      toast.success('Editor link copied! Live link ready.');
    } catch (e) {
      console.error('Failed to create share link:', e);
      toast.error('Failed to create share link');
    }
  };

  const copyEditorLink = async () => {
    if (!editorLink) return;
    await navigator.clipboard.writeText(editorLink);
    toast.success('Editor link copied');
  };

  const copyLiveLink = async () => {
    if (!liveLink) return;
    await navigator.clipboard.writeText(liveLink);
    toast.success('Live link copied');
  };

  const copyBothLinks = async () => {
    if (!liveLink || !editorLink) return;
    const both = `Live: ${liveLink}\nEditor: ${editorLink}`;
    await navigator.clipboard.writeText(both);
    toast.success('Live & editor links copied');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <Toaster position="bottom-right" />
      {/* Header */}
      <header className="h-14 border-b border-gray-800 flex items-center px-4 justify-between bg-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <Code2 className="text-blue-500" />
          <span className="font-bold text-lg tracking-tight">HTML Studio</span>
        </div>
         <div className="flex gap-2">
           <button 
             onClick={handleDownload}
             className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors border border-gray-700"
           >
             <Download size={14} /> Download
           </button>
            {!editorLink && (
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors font-medium"
              >
                <Share2 size={14} /> Share
              </button>
            )}
            {liveLink && editorLink && (
              <>
                <button
                  onClick={copyEditorLink}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors border border-gray-700"
                >
                  Copy editor
                </button>
                <button
                  onClick={copyLiveLink}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors border border-gray-700"
                >
                  Copy live
                </button>
                <button
                  onClick={copyBothLinks}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors border border-gray-700"
                >
                  Copy both
                </button>
              </>
            )}
           {liveLink && (
             <a
               href={liveLink}
               target="_blank"
               rel="noreferrer"
               className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors font-medium"
               title={editorLink ? `Editor link: ${editorLink}` : 'View live'}
             >
               <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden />
               Live
             </a>
           )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={50} minSize={20}>
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <div className="flex bg-[#1e1e1e] border-b border-gray-800">
                <button
                  onClick={() => setActiveTab('html')}
                  className={clsx(
                    "px-4 py-2 flex items-center gap-2 text-sm transition-colors border-r border-gray-800",
                    activeTab === 'html' ? "bg-[#1e1e1e] text-orange-400 border-t-2 border-t-orange-400" : "text-gray-400 hover:bg-gray-800 bg-[#252526]"
                  )}
                >
                  <FileCode size={16} /> HTML
                </button>
                <button
                  onClick={() => setActiveTab('css')}
                  className={clsx(
                    "px-4 py-2 flex items-center gap-2 text-sm transition-colors border-r border-gray-800",
                    activeTab === 'css' ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-400" : "text-gray-400 hover:bg-gray-800 bg-[#252526]"
                  )}
                >
                  <FileCode size={16} /> CSS
                </button>
                <button
                  onClick={() => setActiveTab('js')}
                  className={clsx(
                    "px-4 py-2 flex items-center gap-2 text-sm transition-colors border-r border-gray-800",
                    activeTab === 'js' ? "bg-[#1e1e1e] text-yellow-400 border-t-2 border-t-yellow-400" : "text-gray-400 hover:bg-gray-800 bg-[#252526]"
                  )}
                >
                  <FileJson size={16} /> JS
                </button>
              </div>

              {/* Editor */}
              <div className="flex-1 relative">
                {activeTab === 'html' && (
                  <CodeEditor language="html" value={html} onChange={(v) => setHtml(v || '')} />
                )}
                {activeTab === 'css' && (
                  <CodeEditor language="css" value={css} onChange={(v) => setCss(v || '')} />
                )}
                {activeTab === 'js' && (
                  <CodeEditor language="javascript" value={js} onChange={(v) => setJs(v || '')} />
                )}
              </div>
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-500 transition-colors cursor-col-resize" />
          
          <Panel minSize={20}>
            <div className="h-full flex flex-col bg-white">
               <div className="h-8 bg-gray-100 border-b flex items-center px-2 text-xs text-gray-500">
                 Preview
               </div>
               <div className="flex-1 relative">
                 <Preview />
               </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
