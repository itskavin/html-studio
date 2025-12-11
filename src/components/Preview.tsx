import React, { useEffect, useState } from 'react';
import { useCodeStore } from '../store/useCodeStore';

export const Preview: React.FC = () => {
  const { html, css, js } = useCodeStore();
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSrcDoc(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>
              try {
                ${js}
              } catch (err) {
                console.error(err);
              }
            </script>
          </body>
        </html>
      `);
    }, 500); // Debounce

    return () => clearTimeout(timeout);
  }, [html, css, js]);

  return (
    <iframe
      title="preview"
      srcDoc={srcDoc}
      className="w-full h-full border-none bg-white"
      sandbox="allow-scripts"
    />
  );
};
