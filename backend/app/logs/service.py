from pathlib import Path
from typing import Dict, Any, Generator, List
import os

class LogService:
    def __init__(self, logs_dir: str = "build_log_examples"):
        self.logs_dir = Path(logs_dir)
        self._line_index_cache: Dict[str, tuple[List[int], float]] = {}  # filename -> (index, mtime)
        self.INDEX_GRANULARITY = 100  # Index every 100th line

    def _get_friendly_name(self, filename: str) -> str:
        """
        Convert a filename to a friendly display name.
        Example: 'build_log_2024_03_20.log' -> 'Build Log March 20, 2024'
        """
        # Remove file extension
        name = Path(filename).stem
        
        # Replace underscores with spaces
        name = name.replace('_', ' ')
        
        # Capitalize each word
        name = ' '.join(word.capitalize() for word in name.split())
        
        return name

    def list_logs(self) -> Dict[str, Any]:
        """
        List all log files in the logs directory, sorted by modification time (newest first).
        
        Returns:
            Dict containing either the list of files or an error message
        """
        if not self.logs_dir.exists():
            return {"error": f"{self.logs_dir} directory not found"}
        
        files = []
        for file in self.logs_dir.iterdir():
            if file.is_file():
                files.append({
                    "name": self._get_friendly_name(file.name),
                    "filename": file.name,  # Keep original filename for reference
                    "size": file.stat().st_size,
                    "modified": file.stat().st_mtime
                })
        
        # Sort files by modification time in descending order (newest first)
        files.sort(key=lambda x: x["modified"], reverse=True)
        
        return {"files": files}

    def _build_line_index(self, file_path: Path) -> List[int]:
        """
        Build an index of line start positions for a file.
        Stores the byte offset of every Nth line.
        """
        filename = file_path.name
        current_mtime = file_path.stat().st_mtime

        if filename in self._line_index_cache:
            index, mtime = self._line_index_cache[filename]
            if mtime == current_mtime:
                return index

        index = [0]
        with open(file_path, 'rb') as f:
            line_count = 0
            while f.readline():
                line_count += 1
                if line_count % self.INDEX_GRANULARITY == 0:
                    index.append(f.tell())
        
        self._line_index_cache[filename] = (index, current_mtime)
        return index

    def _find_line_position(self, file_path: Path, target_line: int) -> int:
        """
        Find the byte position of a specific line number using a pre-built index.
        """
        if target_line <= 0:
            return 0
            
        index = self._build_line_index(file_path)
        
        index_pos = (target_line -1) // self.INDEX_GRANULARITY
        
        if index_pos >= len(index):
            # If target line is beyond our index, start from the last indexed position
            start_pos = index[-1]
            lines_to_skip = (target_line -1) - (len(index) -1) * self.INDEX_GRANULARITY
        else:
            start_pos = index[index_pos]
            lines_to_skip = (target_line - 1) % self.INDEX_GRANULARITY

        with open(file_path, 'rb') as f:
            f.seek(start_pos)
            for _ in range(lines_to_skip):
                if not f.readline():
                    break
            return f.tell()

    def read_log_chunks(self, filename: str, start_line: int = 1, num_lines: int = 100) -> Generator[str, None, None]:
        """
        Read a log file in chunks starting from a specific line number.
        Uses a pre-built index for efficient seeking.
        
        Args:
            filename: Name of the log file to read
            start_line: Line number to start reading from (1-based)
            num_lines: Number of lines to read
            
        Returns:
            Generator yielding chunks of the file content
        """
        file_path = self.logs_dir / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Log file {filename} not found")

        # Find the starting position efficiently
        start_pos = self._find_line_position(file_path, start_line)
        lines_read = 0
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            f.seek(start_pos)
            while lines_read < num_lines:
                line = f.readline()
                if not line:  # EOF
                    break
                yield line
                lines_read += 1 