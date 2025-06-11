from pathlib import Path
from typing import Dict, Any

class LogService:
    def __init__(self, logs_dir: str = "build_log_examples"):
        self.logs_dir = Path(logs_dir)

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
        List all log files in the logs directory.
        
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
        
        return {"files": files} 