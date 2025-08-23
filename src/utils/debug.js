// Debug utility functions

let debugEnabled = false;
let debugLogs = [];

export const setDebugMode = (enabled) => {
  debugEnabled = enabled;
  if (enabled) {
    console.log('🔧 S3Deck Debug Mode: ENABLED');
  } else {
    console.log('🔧 S3Deck Debug Mode: DISABLED');
  }
};

export const debug = {
  log: (category, message, data = null) => {
    if (!debugEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      category,
      message,
      data
    };
    
    debugLogs.push(logEntry);
    
    // Keep only last 100 logs
    if (debugLogs.length > 100) {
      debugLogs = debugLogs.slice(-100);
    }
    
    const prefix = `[${category}]`;
    const style = getCategoryStyle(category);
    
    if (data) {
      console.log(`%c${prefix} ${message}`, style, data);
    } else {
      console.log(`%c${prefix} ${message}`, style);
    }
  },
  
  error: (category, message, error = null) => {
    if (!debugEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      category,
      message,
      error: error?.message || error,
      type: 'error'
    };
    
    debugLogs.push(logEntry);
    
    console.error(`%c[${category}] ERROR: ${message}`, 'color: red; font-weight: bold;', error);
  },
  
  network: (method, url, data = null, response = null) => {
    if (!debugEnabled) return;
    
    debug.log('NETWORK', `${method} ${url}`, { request: data, response });
  },
  
  upload: (message, data = null) => {
    debug.log('UPLOAD', message, data);
  },
  
  settings: (message, data = null) => {
    debug.log('SETTINGS', message, data);
  },
  
  s3: (message, data = null) => {
    debug.log('S3', message, data);
  },
  
  ui: (message, data = null) => {
    debug.log('UI', message, data);
  },
  
  getLogs: () => debugLogs,
  
  clearLogs: () => {
    debugLogs = [];
    console.log('🔧 Debug logs cleared');
  },
  
  exportLogs: () => {
    const blob = new Blob([JSON.stringify(debugLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `s3deck-debug-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

const getCategoryStyle = (category) => {
  const styles = {
    UPLOAD: 'color: #10b981; font-weight: bold;',
    NETWORK: 'color: #3b82f6; font-weight: bold;',
    SETTINGS: 'color: #8b5cf6; font-weight: bold;',
    S3: 'color: #f59e0b; font-weight: bold;',
    UI: 'color: #06b6d4; font-weight: bold;',
    DEFAULT: 'color: #6b7280; font-weight: bold;'
  };
  
  return styles[category] || styles.DEFAULT;
};