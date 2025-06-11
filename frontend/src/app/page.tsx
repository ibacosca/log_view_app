"use client";

import { useState, useEffect, useCallback } from 'react';

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
  const [totalLines, setTotalLines] = useState(0); // We might not know this upfront
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineNumberInput, setLineNumberInput] = useState('');

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

  const fetchLogContent = useCallback(async (filename: string, startLine: number) => {
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
      setLogContent(lines);
      // This is an approximation of total lines. For accurate total lines, the API would need to provide it.
      if (lines.length < LINES_PER_PAGE) {
        setTotalLines((currentPage - 1) * LINES_PER_PAGE + lines.length);
      } else {
        // We don't know the end, so just allow going to the next page
        setTotalLines((currentPage) * LINES_PER_PAGE + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLogContent([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  // Effect to fetch content when selected log or page changes
  useEffect(() => {
    if (selectedLog) {
      const startLine = (currentPage - 1) * LINES_PER_PAGE + 1;
      fetchLogContent(selectedLog.filename, startLine);
    }
  }, [selectedLog, currentPage, fetchLogContent]);

  const handleLogSelect = (log: LogFile) => {
    setSelectedLog(log);
    setCurrentPage(1);
    setTotalLines(0);
    setLogContent([]);
    setLineNumberInput('');
  };

  const handleGoToLine = () => {
    const line = parseInt(lineNumberInput, 10);
    if (!isNaN(line) && line > 0) {
      setCurrentPage(Math.floor((line - 1) / LINES_PER_PAGE) + 1);
    }
  };

  const totalPages = selectedLog ? Math.ceil(totalLines / LINES_PER_PAGE) : 0;
  
  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    if (logContent.length >= LINES_PER_PAGE) {
       setCurrentPage(p => p + 1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold">Build Logs</h1>
        </div>
        <nav className="flex-grow p-4 overflow-y-auto">
          {error && <div className="text-red-500 text-sm mb-4">Error: {error}</div>}
          <ul>
            {logs.map((log) => (
              <li key={log.filename} 
                  className={`p-2 rounded-md cursor-pointer text-sm mb-1 ${selectedLog?.filename === log.filename ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                  onClick={() => handleLogSelect(log)}>
                <div className="font-medium">{log.name}</div>
                <div className="text-xs text-gray-500">{new Date(log.modified * 1000).toLocaleString()}</div>
                <div className="text-xs text-gray-500">{(log.size / 1024).toFixed(2)} KB</div>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
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
        
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
           <pre id="log-content" className="bg-gray-900 text-white p-4 rounded-md text-sm overflow-x-auto h-full">
                <code className="font-mono">
                  {isLoading && <div className="animate-pulse">Loading log content...</div>}
                  {!isLoading && logContent.length > 0 && 
                    logContent.map((line, index) => {
                      const lineNumber = (currentPage - 1) * LINES_PER_PAGE + index + 1;
                      return (
                        <div key={index} className="flex">
                          <span className="w-12 text-gray-500 text-right pr-4 select-none">{lineNumber}</span>
                          <span>{line}</span>
                        </div>
                      )
                    })
                  }
                  {!isLoading && !selectedLog && <div>Please select a log file from the list on the left.</div>}
                  {!isLoading && selectedLog && logContent.length === 0 && <div>No content to display for this log.</div>}
                </code>
            </pre>
        </div>

        {selectedLog && (
          <footer className="bg-white border-t border-gray-200 p-2 flex justify-center items-center">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-sm text-gray-700 mx-4">
              Page {currentPage}
            </span>
            <button onClick={handleNextPage} disabled={logContent.length < LINES_PER_PAGE} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </footer>
        )}
      </main>
    </div>
  );
}
