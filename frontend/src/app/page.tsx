"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// Define types for our data
interface LogFile {
  name: string;
  filename: string;
  size: number;
  modified: number;
}

interface LogData {
  files: LogFile[];
  error?: string;
}

const API_BASE_URL = 'http://localhost:8000';
const LINES_PER_PAGE = 100;

export default function Home() {
  const [logs, setLogs] = useState<LogFile[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogFile | null>(null);
  const [logContent, setLogContent] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineNumberInput, setLineNumberInput] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver>();
  const lastLogElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setCurrentPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  // Fetch the list of logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/logs`);
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data: LogData = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setLogs(data.files || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };
    fetchLogs();
  }, []);

  // Define fetchLogContent using useCallback to memoize it
  const fetchLogContent = useCallback(async (filename: string, startLine: number, clearContent: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/logs/${filename}?start_line=${startLine}&num_lines=${LINES_PER_PAGE}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch log content: ${errorText}`);
      }
      const text = await response.text();
      const lines = text.split('\n');
      
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      
      setLogContent(prevContent => clearContent ? lines : [...prevContent, ...lines]);
      setHasMore(lines.length === LINES_PER_PAGE);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLogContent([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array as it has no external dependencies from props or state

  // Effect to fetch content when selected log or page changes
  useEffect(() => {
    if (selectedLog) {
        const startLine = (currentPage - 1) * LINES_PER_PAGE + 1;
        fetchLogContent(selectedLog.filename, startLine, currentPage === 1);
    }
  }, [selectedLog, currentPage, fetchLogContent]);

  const handleLogSelect = (log: LogFile) => {
    setSelectedLog(log);
    setCurrentPage(1);
    setLogContent([]);
    setLineNumberInput('');
    setHasMore(true);
  };

  const handleGoToLine = () => {
    const line = parseInt(lineNumberInput, 10);
    if (!isNaN(line) && line > 0) {
      setLogContent([]);
      setCurrentPage(Math.floor((line - 1) / LINES_PER_PAGE) + 1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold">Build Logs</h1>
        </div>
        <nav className="flex-grow p-4 overflow-y-auto">
          {error && <div className="text-red-500 text-sm mb-4">Error: {error}</div>}
          <ul>
            {logs.map((log) => (
              <li
                key={log.filename}
                className={`p-3 rounded-lg cursor-pointer text-sm mb-3 transition-all ${
                  selectedLog?.filename === log.filename
                    ? 'bg-blue-600 text-white shadow'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => handleLogSelect(log)}
              >
                <div className="font-semibold">{log.name}</div>
                <div className={`text-xs ${selectedLog?.filename === log.filename ? 'text-white' : 'text-gray-700'}`}>{new Date(log.modified * 1000).toLocaleString()}</div>
                <div className={`text-xs ${selectedLog?.filename === log.filename ? 'text-white' : 'text-gray-700'}`}>{(log.size / 1024).toFixed(2)} KB</div>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{selectedLog ? selectedLog.name : 'Select a log to view'}</h2>
          {selectedLog && (
             <div className="flex items-center">
                <input
                    type="number"
                    value={lineNumberInput}
                    onChange={(e) => setLineNumberInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGoToLine()}
                    placeholder="Go to line..."
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm w-32"
                />
                <button onClick={handleGoToLine} className="ml-2 px-4 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">Go</button>
            </div>
          )}
        </header>
        
        <div className="flex-1 min-h-0 p-4 bg-gray-50 flex flex-col">
          <pre
            id="log-content"
            className="bg-gray-900 text-white p-4 rounded-lg text-sm flex-1 overflow-y-scroll overflow-x-auto leading-relaxed border border-gray-300 shadow-inner"
          >
            <code className="font-mono">
              {logContent.map((line, index) => {
                const isLastElement = index === logContent.length - 1;
                const lineNumber = (currentPage - 1) * LINES_PER_PAGE + index + 1;
                if (isLastElement) {
                  return (
                    <div ref={lastLogElementRef} key={lineNumber} className="flex">
                      <span className="w-16 text-right pr-4 text-gray-400 select-none font-mono">{lineNumber}</span>
                      <span className="flex-1 font-mono break-all">{line}</span>
                    </div>
                  );
                } else {
                  return (
                    <div key={lineNumber} className="flex">
                      <span className="w-16 text-right pr-4 text-gray-400 select-none font-mono">{lineNumber}</span>
                      <span className="flex-1 font-mono break-all">{line}</span>
                    </div>
                  );
                }
              })}
              {isLoading && <div className="animate-pulse p-4">Loading more lines...</div>}
              {!isLoading && !selectedLog && <div className="p-4">Please select a log file from the list on the left.</div>}
              {!isLoading && selectedLog && logContent.length === 0 && !hasMore && <div className="p-4">No content to display for this log.</div>}
            </code>
          </pre>
        </div>
      </main>
    </div>
  );
}
