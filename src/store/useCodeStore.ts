import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CodeState {
  html: string;
  css: string;
  js: string;
  setHtml: (code: string) => void;
  setCss: (code: string) => void;
  setJs: (code: string) => void;
}

export const useCodeStore = create<CodeState>()(
  persist(
    (set) => ({
      html: '<div class="container">\n  <h1>Welcome to HTML Studio</h1>\n  <p>Start editing to see some magic happen!</p>\n</div>',
      css: 'body {\n  font-family: system-ui, sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  background: #f0f0f0;\n}\n\n.container {\n  text-align: center;\n  background: white;\n  padding: 2rem;\n  border-radius: 8px;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n}',
      js: 'console.log("Hello from HTML Studio!");',
      setHtml: (html) => set({ html }),
      setCss: (css) => set({ css }),
      setJs: (js) => set({ js }),
    }),
    {
      name: 'html-studio-storage',
    }
  )
);
