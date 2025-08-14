import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import boyLogo from './assets/boy.png';
import * as XLSX from 'xlsx';
import { Volume2, VolumeX, Settings, X as XIcon, Star, ChevronLeft, ChevronRight, ChevronUp, Share2, LogOut, Play, Pause, MessageSquare, MoreVertical } from 'lucide-react';
import ResultPage from './ResultPage';

// Custom CSS for hiding scrollbars while allowing scrolling
const hideScrollbarStyles = `
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;     /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, Opera */
}
`;

// Add styles to document
(() => {
  if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.appendChild(document.createTextNode(hideScrollbarStyles));
    document.head.appendChild(styleEl);
  }
})();

// --- Local Storage Keys ---
const FOLDERS_STORAGE_KEY = 'quizAppFolders';
const CURRENT_ROLE_STORAGE_KEY = 'quizAppCurrentRole';
const DRAFT_STORAGE_KEY = 'quizAppDrafts';
const CHILD_SESSION_KEY = 'quizAppChildSessionId';
const DEFAULT_PER_Q_SECONDS = 15;

// --- App Context (for passing local state) ---
const AppContext = createContext(null);

// --- Main App Component ---
const App = () => {
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem(CURRENT_ROLE_STORAGE_KEY) || 'guest');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(CURRENT_ROLE_STORAGE_KEY, currentRole);
  }, [currentRole]);

  const handleAdminLogin = () => {
    setErrorMessage('');
    setCurrentRole('admin');
  };
  const handleChildLogin = () => {
    setErrorMessage('');
    setCurrentRole('child');
  };
  const handleLogout = () => {
    setCurrentRole('guest');
    setErrorMessage('');
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800 p-4">
        <p className="text-xl font-bold">Error: {errorMessage}</p>
      </div>
    );
  }

  if (currentRole === 'guest') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <RoleSelection onAdminLogin={handleAdminLogin} onChildLogin={handleChildLogin} />
      </div>
    );
  } else if (currentRole === 'admin') {
    return (
      <AppContext.Provider value={{ currentRole, handleLogout, setErrorMessage, errorMessage }}>
        <AdminDashboard />
      </AppContext.Provider>
    );
  } else if (currentRole === 'child') {
    return (
      <AppContext.Provider value={{ currentRole, handleLogout, setErrorMessage, errorMessage }}>
        <ChildDashboard />
      </AppContext.Provider>
    );
  }
};

// --- Role Selection Component ---
const RoleSelection = ({ onAdminLogin, onChildLogin }) => {
  return (
    <div className="main-container bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-10 rounded-3xl shadow-2xl w-full max-w-lg mx-auto flex flex-col items-center gap-8 animate-fade-in-scale">
      <img src={boyLogo} alt="Logo" className="w-20 h-20 mb-2 rounded-full shadow-lg border-2 border-blue-200" />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center tracking-tight drop-shadow">Welcome</h1>
      <button onClick={onAdminLogin} className="bg-blue-600 text-white py-4 px-6 rounded-xl text-2xl font-bold shadow-xl hover:bg-blue-700 hover:scale-105 hover:shadow-2xl transition-all duration-300 w-full focus:outline-none focus:ring-4 focus:ring-blue-300">Admin Panel</button>
      <button onClick={onChildLogin} className="bg-green-600 text-white py-4 px-6 rounded-xl text-2xl font-bold shadow-xl hover:bg-green-700 hover:scale-105 hover:shadow-2xl transition-all duration-300 w-full focus:outline-none focus:ring-4 focus:ring-green-300">User</button>
    </div>
  );
};

// --- Reusable Confirm Dialog ---
const ConfirmDialog = ({ open, title = 'Confirm', message, confirmText = 'Yes', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black 40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="px-4 py-3 border-b">
          <h4 className="text-base font-semibold text-gray-800">{title}</h4>
        </div>
        <div className="px-4 py-4 text-sm text-gray-700">{message}</div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">{cancelText}</button>
          <button onClick={onConfirm} className="px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// --- Folder Item Component for Nested Display ---
const FolderItem = ({ 
  folder, 
  selectedFolderIdForQuizzes, 
  setSelectedFolderIdForQuizzes, 
  setFolderToDelete, 
  setConfirmDeleteFolderOpen,
  setCreatingSubfolderFor,
  level = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
  const totalQuizzes = (folder.quizzes?.length || 0) + 
    (folder.subfolders?.reduce((sum, sub) => sum + (sub.quizzes?.length || 0), 0) || 0);

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
  <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer transition-transform transform hover:scale-105 hover:shadow-xl ${
        selectedFolderIdForQuizzes === folder.id 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input 
              type="radio" 
              name="selectFolder" 
              value={folder.id} 
              checked={selectedFolderIdForQuizzes === folder.id} 
              onChange={() => setSelectedFolderIdForQuizzes(folder.id)} 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            {hasSubfolders && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            )}
            <div>
              <h3 className="font-medium text-gray-800">{folder.name}</h3>
              <p className="text-sm text-gray-500">
                {folder.quizzes?.length || 0} direct quiz{(folder.quizzes?.length || 0) !== 1 ? 'es' : ''}
                {hasSubfolders && ` • ${totalQuizzes} total`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
              onClick={() => setCreatingSubfolderFor(folder.id)}
              title="Add subfolder"
            >
              <span className="text-xs font-bold">+</span>
            </button>
            <button
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              onClick={() => { setFolderToDelete(folder); setConfirmDeleteFolderOpen(true); }}
              title="Delete folder"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Subfolders */}
      {hasSubfolders && isExpanded && (
        <div className="mt-2 space-y-2">
          {folder.subfolders.map(subfolder => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              selectedFolderIdForQuizzes={selectedFolderIdForQuizzes}
              setSelectedFolderIdForQuizzes={setSelectedFolderIdForQuizzes}
              setFolderToDelete={setFolderToDelete}
              setConfirmDeleteFolderOpen={setConfirmDeleteFolderOpen}
              setCreatingSubfolderFor={setCreatingSubfolderFor}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Admin Dashboard Component ---
const AdminDashboard = () => {
  const { handleLogout, setErrorMessage, errorMessage } = useContext(AppContext);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingSubfolderFor, setCreatingSubfolderFor] = useState(null);
  const [folders, setFolders] = useState(() => {
    try {
      const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
      return storedFolders ? JSON.parse(storedFolders) : [];
    } catch (e) {
      console.error('Error parsing folders from localStorage', e);
      return [];
    }
  });
  
  // Helper function to find a folder by ID (searches both top-level and nested)
  const findFolderById = (folderId, foldersArray = folders) => {
    for (const folder of foldersArray) {
      if (folder.id === folderId) return folder;
      if (folder.subfolders && folder.subfolders.length > 0) {
        const found = findFolderById(folderId, folder.subfolders);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to update a folder by ID (works with nested folders)
  const updateFolderById = (folderId, updateFn, foldersArray = folders) => {
    return foldersArray.map(folder => {
      if (folder.id === folderId) {
        return updateFn(folder);
      }
      if (folder.subfolders && folder.subfolders.length > 0) {
        return {
          ...folder,
          subfolders: updateFolderById(folderId, updateFn, folder.subfolders)
        };
      }
      return folder;
    });
  };

  // Helper function to get all quizzes from folders and subfolders
  const getAllQuizzes = (foldersArray = folders, parentPath = '') => {
    const result = [];
    foldersArray.forEach(folder => {
      const currentPath = parentPath ? `${parentPath} > ${folder.name}` : folder.name;
      
      // Add direct quizzes
      if (folder.quizzes) {
        folder.quizzes.forEach(quiz => {
          result.push({ 
            ...quiz, 
            folderName: currentPath, 
            folderId: folder.id,
            folderPath: currentPath.split(' > ')
          });
        });
      }
      // Add quizzes from subfolders
      if (folder.subfolders && folder.subfolders.length > 0) {
        result.push(...getAllQuizzes(folder.subfolders, currentPath));
      }
    });
    return result;
  };

  const [childResults, setChildResults] = useState(() => {
    try {
      const storedResults = localStorage.getItem('quizAppResults');
      return storedResults ? JSON.parse(storedResults) : [];
    } catch (e) {
      console.error('Error parsing results from localStorage', e);
      return [];
    }
  });
  const [selectedFolderIdForQuizzes, setSelectedFolderIdForQuizzes] = useState(null);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newMediaUrls, setNewMediaUrls] = useState('');
  const [manualQuestions, setManualQuestions] = useState([]);
  const [importDiagnostics, setImportDiagnostics] = useState(null); // show parser info after file choose
  const [confirmDeleteQuizOpen, setConfirmDeleteQuizOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [resultsFilterQuiz, setResultsFilterQuiz] = useState('all');
  const [confirmClearResultsOpen, setConfirmClearResultsOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState(null); // { fileName, questions }
  const [pendingTitle, setPendingTitle] = useState('');
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [confirmDeleteFolderOpen, setConfirmDeleteFolderOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  useEffect(() => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('quizAppResults', JSON.stringify(childResults));
  }, [childResults]);

  const handleCreateFolder = (parentId = null) => {
    if (newFolderName.trim()) {
      const newFolder = { 
        id: Date.now().toString(), 
        name: newFolderName.trim(), 
        createdAt: new Date().toISOString(), 
        quizzes: [],
        parentId: parentId,
        subfolders: []
      };
      
      if (parentId) {
        // Add as a subfolder to the parent
        setFolders(prev => prev.map(folder => 
          folder.id === parentId 
            ? { ...folder, subfolders: [...(folder.subfolders || []), newFolder] }
            : folder
        ));
      } else {
        // Add as a top-level folder
        setFolders(prev => [...prev, newFolder]);
      }
      
      setNewFolderName('');
    } else {
      setErrorMessage('Please enter a folder name.');
    }
  };

  const handleAddQuestionToManualQuiz = () => {
    if (!newQuestionText.trim() || !newOptions.trim() || !newCorrectAnswer.trim()) {
      setErrorMessage('Question text, options, and correct answer are required.');
      return;
    }
    const optionsArray = newOptions.split(',').map(opt => opt.trim()).filter(Boolean);
    const mediaArray = newMediaUrls.split(/[;,]/).map(url => url.trim()).filter(Boolean);
    if (!optionsArray.includes(newCorrectAnswer.trim())) {
      setErrorMessage('Correct answer must be one of the provided options.');
      return;
    }
    const newQuestion = { question: newQuestionText.trim(), options: optionsArray, correctAnswer: newCorrectAnswer.trim(), explanation: newExplanation.trim(), media: mediaArray };
    setManualQuestions(prev => [...prev, newQuestion]);
    // Clear inputs for next question
    setNewQuestionText('');
    setNewOptions('');
    setNewCorrectAnswer('');
    setNewExplanation('');
    setNewMediaUrls('');
    setErrorMessage('');
  };

  const handleSaveManualQuiz = () => {
    if (!selectedFolderIdForQuizzes) {
      setErrorMessage('Please select a folder to save the quiz.');
      return;
    }
    if (!newQuizTitle.trim()) {
      setErrorMessage('Please enter a quiz title.');
      return;
    }
    if (manualQuestions.length === 0) {
      setErrorMessage('Add at least one question to the quiz before saving.');
      return;
    }
    const newQuiz = { id: `quiz-${Date.now()}`, title: newQuizTitle.trim(), questions: manualQuestions, createdAt: new Date().toISOString() };
    setFolders(prevFolders => updateFolderById(selectedFolderIdForQuizzes, folder => ({
      ...folder,
      quizzes: [...(folder.quizzes || []), newQuiz]
    }), prevFolders));
    setNewQuizTitle('');
    setManualQuestions([]);
    setErrorMessage('');
  };

  const handleDeleteQuiz = () => {
    if (!quizToDelete || !selectedFolderIdForQuizzes) { setConfirmDeleteQuizOpen(false); return; }
    setFolders(prevFolders => updateFolderById(selectedFolderIdForQuizzes, folder => ({
      ...folder,
      quizzes: (folder.quizzes || []).filter(q => q.id !== quizToDelete.id)
    }), prevFolders));
    setQuizToDelete(null);
    setConfirmDeleteQuizOpen(false);
  };

  const handleDeleteFolder = () => {
    if (!folderToDelete) { setConfirmDeleteFolderOpen(false); return; }
    
    // Helper function to recursively remove folder from anywhere in the tree
    const removeFolderRecursive = (foldersArray, targetId) => {
      return foldersArray.filter(folder => {
        if (folder.id === targetId) {
          return false; // Remove this folder
        }
        if (folder.subfolders && folder.subfolders.length > 0) {
          // Keep folder but filter its subfolders
          folder.subfolders = removeFolderRecursive(folder.subfolders, targetId);
        }
        return true;
      });
    };
    
    setFolders(prev => removeFolderRecursive(prev, folderToDelete.id));
    
    if (selectedFolderIdForQuizzes === folderToDelete.id) {
      setSelectedFolderIdForQuizzes(null);
    }
    setFolderToDelete(null);
    setConfirmDeleteFolderOpen(false);
  };

  const uniqueQuizTitles = Array.from(new Set((childResults || []).map(r => r.quizTitle))).filter(Boolean);
  const displayResults = (childResults || [])
    .filter(r => resultsFilterQuiz === 'all' ? true : r.quizTitle === resultsFilterQuiz)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const refreshResults = () => {
    try {
      const stored = localStorage.getItem('quizAppResults');
      setChildResults(stored ? JSON.parse(stored) : []);
    } catch {
      setChildResults([]);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedFolderIdForQuizzes) {
      setErrorMessage('Please select a folder before uploading a quiz file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

        // Try to locate the header row (first row that looks like it has a 'question' or 'option' or 'correct')
        const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let headerRowIndex = 0;
        for (let r = 0; r < Math.min(10, jsonRows.length); r++) {
          const row = jsonRows[r] || [];
          const nset = new Set((row || []).map(x => norm(x)));
          const hasQ = Array.from(nset).some(h => h.includes('question') || h === 'q' || h.includes('prompt') || h.includes('title'));
          const hasOption = Array.from(nset).some(h => h.startsWith('option') || ['a','b','c','d','e','f','1','2','3','4','5','6'].includes(h));
          const hasCorrect = Array.from(nset).some(h => h.includes('correct') || h === 'answer' || h === 'ans' || h.includes('key'));
          if (hasQ && (hasOption || hasCorrect)) { headerRowIndex = r; break; }
        }

        const rawHeaders = (jsonRows[headerRowIndex] || []).map(h => String(h || '').trim());
        // Map likely headers to indices (case/space tolerant)
        const headerIndexByKey = {};
        rawHeaders.forEach((h, idx) => {
          const n = norm(h);
          headerIndexByKey[n] = idx;
        });

        const pickIdx = (candidates) => {
          for (const c of candidates) {
            if (headerIndexByKey.hasOwnProperty(c)) return headerIndexByKey[c];
          }
          return -1;
        };

        // Identify columns
        const qIdx = pickIdx(['question','ques','questiontext','prompt','title','q']);
        const explIdx = pickIdx(['explanation','explain','solution','reason','note','notes','explaination']);
        const mediaIdx = pickIdx(['mediaurls','media','image','images','imageurl','imageurls','img','imgurl','link','links','mediaurl']);
        const correctIdx = pickIdx(['correctanswer','answer','ans','correct','correctoption','trueanswer','key','rightanswer']);
        const combinedOptionsIdx = pickIdx(['options','choices','optionlist','choice','answers']);

        // Option A-D and/or 1-4 indices
        const optIdx = { A: -1, B: -1, C: -1, D: -1 };
        const optNumIdx = { 1: -1, 2: -1, 3: -1, 4: -1 };
        rawHeaders.forEach((h, idx) => {
          const n = norm(h);
          if (n === 'optiona' || n === 'a' || n === 'opta') optIdx.A = idx;
          if (n === 'optionb' || n === 'b' || n === 'optb') optIdx.B = idx;
          if (n === 'optionc' || n === 'c' || n === 'optc') optIdx.C = idx;
          if (n === 'optiond' || n === 'd' || n === 'optd') optIdx.D = idx;
          if (n === 'option1' || n === '1' || n === 'opt1') optNumIdx[1] = idx;
          if (n === 'option2' || n === '2' || n === 'opt2') optNumIdx[2] = idx;
          if (n === 'option3' || n === '3' || n === 'opt3') optNumIdx[3] = idx;
          if (n === 'option4' || n === '4' || n === 'opt4') optNumIdx[4] = idx;
        });

        const questions = [];
        let rowsConsidered = 0;
  for (let i = headerRowIndex + 1; i < jsonRows.length; i++) {
          const row = jsonRows[i] || [];

          const getCell = (idx) => idx >= 0 ? String(row[idx] ?? '').trim() : '';
          const qText = getCell(qIdx);
          if (!qText) continue; // skip blank rows
          rowsConsidered++;

          // Build options from combined column and A-D/1-4 columns
          let opts = [];
          if (combinedOptionsIdx >= 0) {
            const combined = getCell(combinedOptionsIdx);
            if (combined) {
              opts = opts.concat(combined.split(/[\n;,|]/).map(s => s.trim()).filter(Boolean));
            }
          }
          const addIf = (v) => { const s = String(v || '').trim(); if (s) opts.push(s); };
          addIf(getCell(optIdx.A));
          addIf(getCell(optIdx.B));
          addIf(getCell(optIdx.C));
          addIf(getCell(optIdx.D));
          addIf(getCell(optNumIdx[1]));
          addIf(getCell(optNumIdx[2]));
          addIf(getCell(optNumIdx[3]));
          addIf(getCell(optNumIdx[4]));
          // Deduplicate while preserving order
          const seen = new Set();
          opts = opts.filter(o => { const k = o.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });

          // Need at least two options
          if (opts.length < 2) continue;

          // Determine correct answer
          let corr = getCell(correctIdx);
          const corrNorm = corr.toLowerCase().trim();
          // Map letters/numbers to option text
          const letterMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
          // Accept single-letter like "A" or embedded like "A)" or "Option C"
          const firstLetter = (corrNorm.match(/[a-f]/) || [])[0];
          if (letterMap.hasOwnProperty(corrNorm) && opts[letterMap[corrNorm]] !== undefined) {
            corr = opts[letterMap[corrNorm]];
          } else if (firstLetter && opts[letterMap[firstLetter]] !== undefined) {
            corr = opts[letterMap[firstLetter]];
          } else if (/^\d+/.test(corrNorm)) {
            const idx = parseInt((corrNorm.match(/^\d+/) || ['0'])[0], 10) - 1;
            if (idx >= 0 && idx < opts.length) corr = opts[idx];
          } else {
            // Try to match by text (case-insensitive)
            const hit = opts.find(o => o.toLowerCase() === corrNorm);
            if (hit) corr = hit;
          }

          if (!corr) continue; // must have a correct answer

          const explanation = getCell(explIdx);
          const mediaRaw = getCell(mediaIdx);
          const media = mediaRaw ? mediaRaw.split(/[\s,;|]+/).map(s => s.trim()).filter(Boolean) : [];

          questions.push({
            question: qText,
            options: opts,
            correctAnswer: corr,
            explanation,
            media,
          });
        }
        if (questions.length === 0) {
          setImportDiagnostics({
            fileName: file.name,
            headerRowIndex,
            headers: rawHeaders,
            rowsConsidered,
            parsedCount: questions.length,
            status: 'error',
            note: 'No valid questions parsed. Verify header names and that each row has a Question, at least 2 Options, and a CorrectAnswer.'
          });
          setErrorMessage('No valid questions found in the file. Check headers (Question, OptionA/Option1.., CorrectAnswer, Explanation, MediaURLs) and data format.');
          return;
        }
        const uploadedQuizTitle = file.name.split('.').slice(0, -1).join('.') || 'Imported Quiz';
        // Do not save immediately; store as pending and show Submit button
        setPendingImport({ fileName: file.name, questions });
        setPendingTitle(uploadedQuizTitle);
        setErrorMessage('');
        setImportDiagnostics({
          fileName: file.name,
          headerRowIndex,
          headers: rawHeaders,
          rowsConsidered,
          parsedCount: questions.length,
          status: 'ok',
        });
        event.target.value = null;
      } catch (error) {
        console.error('Error processing file:', error);
        setErrorMessage(`Error processing file: ${error.message}. Make sure it's a valid XLSX/CSV and check console for details.`);
        setImportDiagnostics({ status: 'error', error: String(error?.message || error), fileName: file?.name });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmitImportedQuiz = () => {
    if (!selectedFolderIdForQuizzes || !pendingImport) { setConfirmImportOpen(false); return; }
    const title = (pendingTitle || '').trim() || (pendingImport.fileName?.split('.')?.slice(0, -1)?.join('.') || 'Imported Quiz');
    const newQuiz = { id: `quiz-${Date.now()}`, title, questions: pendingImport.questions, createdAt: new Date().toISOString() };
    setFolders(prevFolders => updateFolderById(selectedFolderIdForQuizzes, folder => ({
      ...folder,
      quizzes: [...(folder.quizzes || []), newQuiz]
    }), prevFolders));
    setConfirmImportOpen(false);
    setPendingImport(null);
    setPendingTitle('');
  };

  const downloadTemplate = () => {
    const csvHeader = [
      'Question',
      'OptionA',
      'OptionB',
      'OptionC',
      'OptionD',
      'CorrectAnswer',
      'Explanation',
      'MediaURLs'
    ].join(',');
    const sample = [
      ['What is 2 + 2?', '3', '4', '5', '6', '4', 'Basic math addition', ''],
      ['Capital of France?', 'Berlin', 'Madrid', 'Paris', 'Rome', 'Paris', 'Paris is the capital city of France', 'https://example.com/paris.jpg']
    ]
      .map(r => r.map(v => typeof v === 'string' && v.includes(',') ? '"' + v.replace(/"/g, '""') + '"' : v).join(','))
      .join('\n');
    const blob = new Blob([[csvHeader, sample].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-4 mb-4">
              
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600">Manage quizzes and monitor results</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Folder Management */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                
                <h2 className="text-xl font-semibold text-gray-800 text-center">Folder Management</h2>
              </div>
              
              {/* Create New Folder */}
              <div className="mb-6">
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={newFolderName} 
                    onChange={(e) => setNewFolderName(e.target.value)} 
                    placeholder={creatingSubfolderFor ? "Enter subfolder name" : "Enter folder name"} 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button 
                    onClick={() => handleCreateFolder(creatingSubfolderFor)} 
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">+</span>
                    {creatingSubfolderFor ? 'Add Sub' : 'Create'}
                  </button>
                </div>
                {creatingSubfolderFor && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                    <span>Creating subfolder in: <strong>{folders.find(f => f.id === creatingSubfolderFor)?.name}</strong></span>
                    <button 
                      onClick={() => setCreatingSubfolderFor(null)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Folders List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {folders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No folders yet</p>
                    <p className="text-sm text-gray-400">Create your first folder above</p>
                  </div>
                ) : (
                  folders.map(folder => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      selectedFolderIdForQuizzes={selectedFolderIdForQuizzes}
                      setSelectedFolderIdForQuizzes={setSelectedFolderIdForQuizzes}
                      setFolderToDelete={setFolderToDelete}
                      setConfirmDeleteFolderOpen={setConfirmDeleteFolderOpen}
                      setCreatingSubfolderFor={setCreatingSubfolderFor}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quiz Management */}
          <div className="lg:col-span-2">
            {!selectedFolderIdForQuizzes ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChevronUp className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Folder</h3>
                <p className="text-gray-500">Choose a folder from the  top manage quizzes</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Quiz Management Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex flex-col items-center gap-3 text-center">
                      
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">Quiz Management</h2>
                        <p className="text-sm text-gray-600">Folder: {findFolderById(selectedFolderIdForQuizzes)?.name}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quiz Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Upload Quiz Card */}
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors">
                      <div className="text-center">
                        
                        <h3 className="font-medium text-gray-800 mb-2">Upload Quiz File</h3>
                        <p className="text-sm text-gray-500 mb-3">Excel or CSV format</p>
                        <input 
                          type="file" 
                          accept=".xlsx, .xls, .csv" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                          id="fileUpload"
                        />
                        <label 
                          htmlFor="fileUpload" 
                          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
                        >
                          Choose File
                        </label>
                        <div className="mt-3">
                          <button 
                            onClick={downloadTemplate} 
                            className="text-sm text-blue-600 hover:underline"
                          >
                            📥 Download Template
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Manual Quiz Card */}
                    <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 transition-colors">
                      <div className="text-center">
                        
                        <h3 className="font-medium text-gray-800 mb-2">Create Manually</h3>
                        <p className="text-sm text-gray-500 mb-3">Add questions one by one</p>
                        <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                          Start Creating
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload Diagnostics */}
                {importDiagnostics && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Upload Results</h3>
                    <div className={`p-4 rounded-lg ${
                      importDiagnostics.status === 'ok' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {importDiagnostics.status === 'ok' ? (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">!</span>
                          </div>
                        )}
                        <span className="font-medium">
                          {importDiagnostics.status === 'ok' ? 'Success' : 'Warning'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        {importDiagnostics.fileName && <p>📁 {importDiagnostics.fileName}</p>}
                        {typeof importDiagnostics.parsedCount === 'number' && 
                          <p>📋 {importDiagnostics.parsedCount} questions parsed</p>}
                        {importDiagnostics.note && <p>💡 {importDiagnostics.note}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Import Preview */}
                {pendingImport && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Preview & Save Quiz</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
                        <input
                          type="text"
                          value={pendingTitle}
                          onChange={(e) => setPendingTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">📊 {pendingImport.questions.length} questions ready to import</p>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {pendingImport.questions.slice(0, 3).map((q, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium">Q{i + 1}:</span> {q.question.substring(0, 60)}...
                            </div>
                          ))}
                          {pendingImport.questions.length > 3 && (
                            <p className="text-xs text-gray-500">...and {pendingImport.questions.length - 3} more questions</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setConfirmImportOpen(true)} 
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Save Quiz
                        </button>
                        <button 
                          onClick={() => { setPendingImport(null); setPendingTitle(''); }} 
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Quiz Creation */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Create Quiz Manually</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
                      <input 
                        type="text" 
                        value={newQuizTitle} 
                        onChange={(e) => setNewQuizTitle(e.target.value)} 
                        placeholder="Enter quiz title" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    
                    {manualQuestions.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">📋 {manualQuestions.length} questions added</p>
                      </div>
                    )}
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-700 mb-3">Add New Question</h4>
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          value={newQuestionText} 
                          onChange={(e) => setNewQuestionText(e.target.value)} 
                          placeholder="Question text" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input 
                          type="text" 
                          value={newOptions} 
                          onChange={(e) => setNewOptions(e.target.value)} 
                          placeholder="Options (comma-separated)" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input 
                          type="text" 
                          value={newCorrectAnswer} 
                          onChange={(e) => setNewCorrectAnswer(e.target.value)} 
                          placeholder="Correct answer" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input 
                          type="text" 
                          value={newExplanation} 
                          onChange={(e) => setNewExplanation(e.target.value)} 
                          placeholder="Explanation (optional)" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      
                      <div className="flex gap-3 mt-4">
                        <button 
                          onClick={handleAddQuestionToManualQuiz} 
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Add Question
                        </button>
                        <button 
                          onClick={() => { setNewQuestionText(''); setNewOptions(''); setNewCorrectAnswer(''); setNewExplanation(''); }} 
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      
                      {manualQuestions.length > 0 && (
                        <button 
                          onClick={handleSaveManualQuiz} 
                          className="w-full mt-4 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                          Save Quiz ({manualQuestions.length} questions)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Existing Quizzes */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 text-center">Quizzes in This Folder</h3>
                  <div className="space-y-3">
                    {findFolderById(selectedFolderIdForQuizzes)?.quizzes?.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Play className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No quizzes yet</p>
                        <p className="text-sm text-gray-400">Create your first quiz above</p>
                      </div>
                    ) : (
                      findFolderById(selectedFolderIdForQuizzes)?.quizzes.map(quiz => (
                        <div key={quiz.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <div>
                            <h4 className="font-medium text-gray-800">{quiz.title}</h4>
                            <p className="text-sm text-gray-500">{quiz.questions?.length || 0} questions</p>
                          </div>
                          <button
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                            onClick={() => { setQuizToDelete(quiz); setConfirmDeleteQuizOpen(true); }}
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-3 mb-4">

              <h2 className="text-xl font-semibold text-gray-800">Quiz Results</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                value={resultsFilterQuiz} 
                onChange={(e) => setResultsFilterQuiz(e.target.value)}
              >
                <option value="all">All quizzes</option>
                {uniqueQuizTitles.map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
              <button 
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm" 
                onClick={refreshResults}
              >
                Refresh
              </button>
              <button 
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm" 
                onClick={() => setConfirmClearResultsOpen(true)}
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {displayResults.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Star className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No results found</p>
                <p className="text-sm text-gray-400">Results will appear here when students complete quizzes</p>
              </div>
            ) : (
              displayResults.map((result, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {result.sessionId?.substring(0, 8)}...
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      (result.score / Math.max(result.totalQuestions || 1, 1)) >= 0.7
                        ? 'bg-green-100 text-green-700'
                        : (result.score / Math.max(result.totalQuestions || 1, 1)) >= 0.5
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {Math.round((result.score / Math.max(result.totalQuestions || 1, 1)) * 100)}%
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-800 mb-1">{result.quizTitle}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Score: {result.score} / {result.totalQuestions}
                  </p>
                  {typeof result.timeUsed === 'number' && (
                    <p className="text-xs text-gray-500 mb-1">
                      Time: {Math.floor(result.timeUsed / 60)}:{String(result.timeUsed % 60).padStart(2, '0')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(result.timestamp).toLocaleDateString()} {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteQuizOpen}
        title="Delete Quiz"
        message={`Are you sure you want to delete \"${quizToDelete?.title}\"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteQuiz}
        onCancel={() => { setConfirmDeleteQuizOpen(false); setQuizToDelete(null); }}
      />
      <ConfirmDialog
        open={confirmDeleteFolderOpen}
        title="Delete Folder"
        message={`Delete folder \"${folderToDelete?.name}\" and all its quizzes? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteFolder}
        onCancel={() => { setConfirmDeleteFolderOpen(false); setFolderToDelete(null); }}
      />
      <ConfirmDialog
        open={confirmClearResultsOpen}
        title="Clear All Results"
        message="Remove all stored child results? This will clear local history."
        confirmText="Clear"
        onConfirm={() => { localStorage.removeItem('quizAppResults'); setChildResults([]); setConfirmClearResultsOpen(false); }}
        onCancel={() => setConfirmClearResultsOpen(false)}
      />
      <ConfirmDialog
        open={confirmImportOpen}
        title="Save Imported Quiz"
        message={`Save this imported quiz (\"${(pendingTitle || pendingImport?.fileName || 'Imported Quiz')}\") to the selected folder?`}
        confirmText="Save"
        onConfirm={handleSubmitImportedQuiz}
        onCancel={() => setConfirmImportOpen(false)}
      />
    </div>
  );
};

// --- Child Dashboard Component ---
const ChildDashboard = () => {
  const { handleLogout, setErrorMessage } = useContext(AppContext);
  const [folders, setFolders] = useState(() => {
    try {
      const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
      return storedFolders ? JSON.parse(storedFolders) : [];
    } catch (e) {
      console.error('Error parsing folders from localStorage', e);
      return [];
    }
  });
  
  // Helper function to get all quizzes from folders and subfolders
  const getAllQuizzes = (foldersArray = folders, parentPath = '') => {
    const result = [];
    foldersArray.forEach(folder => {
      const currentPath = parentPath ? `${parentPath} > ${folder.name}` : folder.name;
      
      // Add direct quizzes
      if (folder.quizzes) {
        folder.quizzes.forEach(quiz => {
          result.push({ 
            ...quiz, 
            folderName: currentPath, 
            folderId: folder.id,
            folderPath: currentPath.split(' > ')
          });
        });
      }
      // Add quizzes from subfolders
      if (folder.subfolders && folder.subfolders.length > 0) {
        result.push(...getAllQuizzes(folder.subfolders, currentPath));
      }
    });
    return result;
  };

  const [currentSessionId] = useState(() => {
    const existing = localStorage.getItem(CHILD_SESSION_KEY);
    if (existing) return existing;
    const sid = Date.now().toString();
    localStorage.setItem(CHILD_SESSION_KEY, sid);
    return sid;
  });
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [folderFilter, setFolderFilter] = useState('all');
  const [quizActive, setQuizActive] = useState(false);
  const [lastResult, setLastResult] = useState(null); // store last quiz summary for child
  const [reviewActive, setReviewActive] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(() => {
    const raw = localStorage.getItem('quizAppTimePerQuestion');
    const n = raw ? parseInt(raw, 10) : DEFAULT_PER_Q_SECONDS;
    return Number.isFinite(n) && n > 3 ? n : DEFAULT_PER_Q_SECONDS;
  });
  const [resumeDraft, setResumeDraft] = useState(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showResultPage, setShowResultPage] = useState(false);
  const [allResults, setAllResults] = useState(() => {
    try {
      const stored = localStorage.getItem('quizAppResults');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const audioCtxRef = useRef(null);

  const canPlaySound = () => {
    try { return localStorage.getItem('quizAppSoundOn') !== 'false'; } catch { return true; }
  };
  const playTone = (freq = 880, duration = 0.12, type = 'sine', volume = 0.08) => {
    if (!canPlaySound()) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain); gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  };
  const playSuccessChime = () => {
    playTone(740, 0.12, 'sine', 0.09);
    setTimeout(() => playTone(988, 0.18, 'sine', 0.09), 120);
  };

  const allAvailableQuizzes = getAllQuizzes();

  useEffect(() => {
    localStorage.setItem('quizAppTimePerQuestion', String(timePerQuestion));
  }, [timePerQuestion]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      const drafts = raw ? JSON.parse(raw) : {};
      const bySession = drafts[currentSessionId];
      if (bySession) setResumeDraft(bySession);
    } catch (e) {
      console.error('Error loading drafts', e);
    }
  }, [currentSessionId]);

  const handleStartQuiz = (quiz) => {
    // Set specific message based on replay type if it's a replay
    if (quiz.replayType) {
      let message = "";
      let questionCount = quiz.questions?.length || 0;
      
      switch(quiz.replayType) {
        case 'wrong':
          message = `Starting quiz with ${questionCount} wrong questions`;
          break;
        case 'favorite':
          message = `Starting quiz with ${questionCount} favorite questions`;
          break;
        case 'answered':
          message = `Starting quiz with ${questionCount} correctly answered questions`;
          break;
        case 'skipped':
          message = `Starting quiz with ${questionCount} skipped questions`;
          break;
        case 'all':
          message = `Starting quiz with all ${questionCount} questions`;
          break;
      }
      
      // Display a temporary notification to the user
      setErrorMessage(""); // Clear any previous error
      
      // Set a temporary success message
      const tempElement = document.createElement('div');
      tempElement.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      tempElement.innerHTML = `<strong>Quiz Starting:</strong> ${message}`;
      document.body.appendChild(tempElement);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (document.body.contains(tempElement)) {
          document.body.removeChild(tempElement);
        }
      }, 3000);
      
      console.log(message);
    }
    
    setSelectedQuiz(quiz);
    setQuizActive(true);
  };

  const handleQuizComplete = (score, totalQuestions, quizTitle, userAnswers = []) => {
    // Support both old signature (score, totalQuestions, quizTitle) and new object payload
    let details;
    if (typeof score === 'object' && score !== null) {
      details = score;
    } else {
      // Calculate wrong and skipped questions for replay functionality
      const questions = selectedQuiz?.questions || [];
      const wrongQuestions = [];
      const answeredQuestions = [];
      
      // Create a map of question indexes to user answers
      const userAnswerMap = Array.isArray(userAnswers) ? userAnswers.reduce((map, answer, index) => {
        map[index] = answer;
        return map;
      }, {}) : {};
      
      // Identify wrong and answered questions
      questions.forEach((question, index) => {
        const userAnswer = userAnswerMap[index];
        
        // If user answered this question
        if (userAnswer) {
          // Add to answered questions
          answeredQuestions.push({
            ...question,
            userAnswer
          });
          
          // If answer is wrong, add to wrong questions
          if (userAnswer !== question.correctAnswer) {
            wrongQuestions.push({
              ...question,
              userAnswer
            });
          }
        }
      });
      
      details = {
        score: score || 0,
        totalQuestions: totalQuestions || (selectedQuiz?.questions?.length || 0),
        quizTitle: quizTitle || selectedQuiz?.title || 'Quiz',
        quizId: selectedQuiz?.id,
        questions: answeredQuestions,
        wrongQuestions: wrongQuestions,
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId
      };
    }

    // Persist to localStorage with required minimal fields for Admin view
    let storedResults = [];
    try {
      const existingResults = localStorage.getItem('quizAppResults');
      storedResults = existingResults ? JSON.parse(existingResults) : [];
    } catch (e) {
      console.error('Error parsing existing results from localStorage', e);
    }
    const persisted = { sessionId: currentSessionId, ...details };
    localStorage.setItem('quizAppResults', JSON.stringify([...storedResults, persisted]));

    // Clear any draft for this session on completion
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      const drafts = raw ? JSON.parse(raw) : {};
      if (drafts[currentSessionId]) {
        delete drafts[currentSessionId];
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      }
    } catch {}

    // Update child summary state
    setLastResult(persisted);
    setAllResults(prev => [...prev, persisted]);
    setShowResult(true);
    setShowResultPage(true); // Show detailed result page
    setCelebrate(true);
    playSuccessChime();
    setTimeout(() => setCelebrate(false), 4000);
    setReviewActive(false);
    setReviewIndex(0);
    setQuizActive(false);
    setSelectedQuiz(null);
  };

  const CountUp = ({ value = 0, duration = 800 }) => {
    const [n, setN] = useState(0);
    useEffect(() => {
      let raf;
      const start = performance.now();
      const animate = (t) => {
        const p = Math.min(1, (t - start) / duration);
        setN(Math.round(value * p));
        if (p < 1) raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(raf);
    }, [value, duration]);
    return <>{n}</>;
  };

  const ConfettiOverlay = () => (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <style>{`@keyframes fall{0%{transform:translateY(-10%) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}`}</style>
      {Array.from({length: 40}).map((_,i)=>{
        const left = Math.random()*100;
        const delay = Math.random()*0.8;
        const dur = 2.8 + Math.random()*1.4;
        const size = 6 + Math.random()*8;
        const colors = ['#34d399','#60a5fa','#f59e0b','#ef4444','#a78bfa'];
        const bg = colors[i%colors.length];
        return <span key={i} style={{position:'absolute',left:`${left}%`,top:'-5%',width:size,height:size,backgroundColor:bg,display:'inline-block',borderRadius:2,animation:`fall ${dur}s ${delay}s linear forwards`,opacity:0.9}}/>;
      })}
    </div>
  );

  // Handle replaying quizzes from result page
  const handleReplayQuiz = (replayData) => {
    const { replayType, quizId, questions = [], wrongQuestions = [], favoriteQuestions = [] } = replayData;
    
    // First try to find the original quiz that was taken
    let originalQuiz = allAvailableQuizzes.find(q => q.id === quizId);
    
    // If we can't find the quiz by ID, try to find it by title
    if (!originalQuiz && lastResult && lastResult.quizTitle) {
      originalQuiz = allAvailableQuizzes.find(q => q.title === lastResult.quizTitle);
    }
    
    // If still not found, create a synthetic quiz from the result data
    if (!originalQuiz) {
      // Create a temporary quiz from the result data
      originalQuiz = {
        id: quizId || `temp-quiz-${Date.now()}`,
        title: lastResult?.quizTitle || "Quiz Replay",
        questions: []
      };
      
      // Try to reconstruct questions from the result data
      if (Array.isArray(questions) && questions.length > 0) {
        originalQuiz.questions = questions.map(q => ({
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }));
      } else if (lastResult && Array.isArray(lastResult.questions)) {
        originalQuiz.questions = lastResult.questions.map(q => ({
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }));
      }
      
      // If we still have no questions, show error and return
      if (originalQuiz.questions.length === 0) {
        setErrorMessage("Cannot find question data to replay the quiz.");
        return;
      }
    }
    
    // Prepare questions based on replay type
    let filteredQuestions = [];
    
    switch(replayType) {
      case 'wrong':
        if (Array.isArray(wrongQuestions) && wrongQuestions.length > 0) {
          // Use the wrong questions directly if available
          filteredQuestions = wrongQuestions.map(q => ({
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          }));
        } else {
          // Fallback to filter original quiz questions
          filteredQuestions = originalQuiz.questions.filter(q => 
            wrongQuestions.some(wq => wq.question === q.question)
          );
        }
        break;
        
      case 'favorite':
        // Filter to only include favorited questions
        filteredQuestions = originalQuiz.questions.filter(q => 
          favoriteQuestions.some(fq => fq.question === q.question)
        );
        // If no favorites found, use all questions
        if (filteredQuestions.length === 0) {
          filteredQuestions = [...originalQuiz.questions];
        }
        break;
        
      case 'answered':
        // Filter to only include correctly answered questions
        filteredQuestions = originalQuiz.questions.filter(q => 
          questions.some(aq => aq.question === q.question && aq.userAnswer === q.correctAnswer)
        );
        break;
        
      case 'skipped':
        // Get all answered questions (both right and wrong)
        const answeredQuestions = questions.filter(q => q.userAnswer);
        
        // Filter for questions that weren't answered
        filteredQuestions = originalQuiz.questions.filter(q => 
          !answeredQuestions.some(aq => aq.question === q.question)
        );
        break;
        
      case 'all':
      default:
        // Include all original questions
        filteredQuestions = [...originalQuiz.questions];
        break;
    }
    
    // Safety check - if no questions match the filter criteria, use all questions
    if (filteredQuestions.length === 0) {
      console.log("No matching questions for filter type:", replayType);
      filteredQuestions = [...originalQuiz.questions];
    }
    
    // Create a modified quiz with the filtered questions
    const quizToStart = {
      ...originalQuiz,
      questions: filteredQuestions,
      replayType: replayType // Add this so we know it's a replay
    };
    
    // Start the quiz
    handleStartQuiz(quizToStart);
    setShowResultPage(false);
  };

  // If showing result page, render it fullscreen
  if (showResultPage && lastResult) {
    return (
      <ResultPage 
        quizResult={lastResult} 
        allResults={allResults}
        onLogout={handleLogout}
        onReplay={handleReplayQuiz}
        onClose={() => {
          setShowResultPage(false);
          setShowResult(false);
        }}
      />
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg mx-auto flex flex-col items-center gap-4">
      
      {/* Main Heading */}
      <div className="w-full text-center mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center"> Quiz Dashboard</h1>
        <p className="text-gray-600 text-center">Select and take quizzes from organized folders</p>
      </div>
      
      {quizActive && selectedQuiz ? (
        <div className="w-full">
          <QuizTakingComponent
            quiz={selectedQuiz}
            onQuizComplete={handleQuizComplete}
            timePerQuestion={timePerQuestion}
            resumeDraft={resumeDraft && resumeDraft.quizId === selectedQuiz.id ? resumeDraft : null}
            sessionId={currentSessionId}
            onDraftUpdate={(draft) => {
              try {
                const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
                const drafts = raw ? JSON.parse(raw) : {};
                if (draft) drafts[currentSessionId] = draft; else delete drafts[currentSessionId];
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
              } catch (e) { console.error('Error saving draft', e); }
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4 w-full">
          {celebrate && <ConfettiOverlay />}
          {showResult && lastResult ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 w-full max-w-md mx-auto text-center animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col items-center">
                <div className="text-sm text-emerald-700 animate-bounce">🎉 Quiz Completed</div>
                <div className="text-lg font-semibold text-emerald-900">{lastResult.quizTitle}</div>
                <button onClick={() => setShowResult(false)} className="mt-2 text-emerald-700 hover:text-emerald-900">Hide</button>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm justify-items-center">
                <div className="rounded-md bg-white border border-emerald-100 p-2">
                  <div className="text-gray-500">Total Questions</div>
                  <div className="font-semibold text-gray-800"><CountUp value={lastResult.totalQuestions} /></div>
                </div>
                <div className="rounded-md bg-white border border-emerald-100 p-2">
                  <div className="text-gray-500">Total Marks</div>
                  <div className="font-semibold text-gray-800"><CountUp value={lastResult.totalQuestions} /></div>
                </div>
                <div className="rounded-md bg-white border border-emerald-100 p-2">
                  <div className="text-gray-500">Marks Obtained</div>
                  <div className="font-semibold text-gray-800"><CountUp value={lastResult.score} /></div>
                </div>
                <div className="rounded-md bg-white border border-emerald-100 p-2">
                  <div className="text-gray-500">Percentage</div>
                  <div className="font-semibold text-gray-800">{Math.round((lastResult.score / Math.max(lastResult.totalQuestions || 1, 1))*100)}%</div>
                </div>
              </div>
              {typeof lastResult.timeUsed === 'number' && (
                <div className="mt-2 text-sm text-gray-700">Time Used: {Math.floor(lastResult.timeUsed / 60)}:{String(lastResult.timeUsed % 60).padStart(2, '0')}</div>
              )}
              <div className="mt-3 text-xs text-gray-500">{new Date(lastResult.timestamp).toLocaleString()}</div>
              <div className="flex justify-center mt-4">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-md shadow"
                  onClick={handleRetakeQuiz}
                >
                  🔄 Reply Quiz
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2">
            <label className="text-sm text-gray-700">Time per question (sec)</label>
            <input
              type="number"
              min={5}
              max={300}
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(parseInt(e.target.value || '0', 10) || DEFAULT_PER_Q_SECONDS)}
              className="w-24 p-1 border rounded-md text-sm text-right"
            />
          </div>
          {resumeDraft ? (
            <div className="bg-amber-50 border border-amber-200 p-2 rounded-md text-sm">
              <div className="font-medium text-amber-800">You have an in-progress attempt.</div>
              <div className="text-amber-700">Quiz: {resumeDraft.quizTitle} • Q{(resumeDraft.currentQIndex || 0) + 1} / {resumeDraft.totalQuestions}</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    const draftQuiz = allAvailableQuizzes.find(q => q.id === resumeDraft.quizId);
                    if (!draftQuiz) { setResumeDraft(null); return; }
                    setSelectedQuiz(draftQuiz);
                    setQuizActive(true);
                  }}
                  className="bg-amber-600 text-white p-2 rounded-full flex items-center justify-center"
                  title="Resume Quiz"
                >
                  <Play size={16} />
                </button>
                <button
                  onClick={() => {
                    try {
                      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
                      const drafts = raw ? JSON.parse(raw) : {};
                      delete drafts[currentSessionId];
                      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
                      setResumeDraft(null);
                    } catch {}
                  }}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm"
                >Discard</button>
              </div>
            </div>
          ) : null}
           {/* View Sample Result Page Button */}
          <button
            onClick={() => {
              const testResult = {
                quizTitle: "Sample Quiz Result",
                score: 8,
                totalQuestions: 10,
                percentage: 80,
                timeUsed: 125,
                timestamp: new Date().toISOString(),
                sessionId: currentSessionId
              };
              setLastResult(testResult);
              setShowResultPage(true);
            }}
            className="bg-purple-500 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-600 mb-4 w-full"
          >
            🎯 View Result Page
          </button>
          <h3 className="text-xl font-semibold text-gray-700 mb-3 text-center">Available Quizzes</h3>
          
         
          
          {/* Folder Organization Display */}
          {allAvailableQuizzes.length > 0 && (
            <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-blue-800">📁 Quiz Organization:</h4>
                <select 
                  value={folderFilter} 
                  onChange={(e) => setFolderFilter(e.target.value)}
                  className="text-xs border border-blue-300 rounded px-2 py-1 bg-white"
                >
                  <option value="all">All Folders</option>
                  {(() => {
                    const uniqueFolders = [...new Set(allAvailableQuizzes.map(quiz => quiz.folderName))];
                    return uniqueFolders.map(folderPath => (
                      <option key={folderPath} value={folderPath}>{folderPath}</option>
                    ));
                  })()}the patch
                </select>
              </div>
              <div className="text-xs text-blue-700">
                {(() => {
                  const folderCounts = {};
                  allAvailableQuizzes.forEach(quiz => {
                    folderCounts[quiz.folderName] = (folderCounts[quiz.folderName] || 0) + 1;
                  });
                  return Object.entries(folderCounts).map(([folderPath, count]) => (
                    <div key={folderPath} className="flex justify-between items-center py-1">
                      <span>{folderPath}</span>
                      <span className="bg-blue-200 px-2 py-0.5 rounded-full">{count} quiz{count !== 1 ? 'es' : ''}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
          
          {/* Upload Quizzes Section */}
          
            <h4 className="text-sm font-medium  text-center"> Uploade Quiz </h4>
            
         
          
          <div className="flex flex-col gap-2 mt-1">
            {allAvailableQuizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes available yet. Ask Admin to create folders and quizzes!</p>
            ) : (
              allAvailableQuizzes
                .filter(quiz => folderFilter === 'all' || quiz.folderName === folderFilter)
                .map(quiz => (
                <div key={quiz.id} className="bg-green-50 p-3 rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          📁 {quiz.folderName} 
                        </span>
                        <span className="text-xs text-gray-500">
                          {quiz.questions?.length || 0} questions
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-800 mb-2">{quiz.title}</h4>
                      {quiz.createdAt && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                            📅 {new Date(quiz.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                            🕒 {new Date(quiz.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleStartQuiz(quiz)} 
                      className="bg-green-400 text-white p-2 rounded-full hover:bg-green-500 flex items-center justify-center ml-3 transition-colors self-center" 
                      title="Start Quiz"
                    >
                      <Play size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmLogoutOpen}
        title="Logout"
        message="Logout now? Your in-progress quiz (if any) is saved and you can resume later."
        confirmText="Logout"
        onConfirm={() => { setConfirmLogoutOpen(false); handleLogout(); }}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
      <ConfirmDialog
        open={confirmLeaveOpen}
        title="Leave Quiz"
        message="Leave this quiz now? Your progress is saved and you can resume later."
        confirmText="Leave"
        onConfirm={() => { setConfirmLeaveOpen(false); setQuizActive(false); setSelectedQuiz(null); }}
        onCancel={() => setConfirmLeaveOpen(false)}
      />
    </div>
  );
};

// --- Quiz Taking Component (card style with progress + timer) ---
const QuizTakingComponent = ({ quiz, onQuizComplete, timePerQuestion = DEFAULT_PER_Q_SECONDS, resumeDraft = null, sessionId, onDraftUpdate }) => {
  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(totalQuestions).fill(null));
  const [selected, setSelected] = useState(null);
  const [perQSec, setPerQSec] = useState(timePerQuestion);
  const [ttsVoice, setTtsVoice] = useState(() => localStorage.getItem('quizAppTtsVoice') || 'female');
  const [animationStyle, setAnimationStyle] = useState('fade');
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [totalSec, setTotalSec] = useState(() => Math.max(timePerQuestion * Math.max(totalQuestions, 1), 30));
  const [totalLeft, setTotalLeft] = useState(() => Math.max(timePerQuestion * Math.max(totalQuestions, 1), 30));
  const [paused, setPaused] = useState(false);
  const [favorites, setFavorites] = useState(() => Array(totalQuestions).fill(false));
  const [notes, setNotes] = useState(() => Array(totalQuestions).fill(''));
  const [images, setImages] = useState(() => Array.from({ length: totalQuestions }, () => Array(10).fill(null)));
  const [ytLinks, setYtLinks] = useState(() => Array(totalQuestions).fill(''));
  const [galleryIdx, setGalleryIdx] = useState(0);
  
  // Question editing states
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptions, setEditOptions] = useState([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  
  const touchRef = useRef({ x: 0, y: 0 });
  const clickTimerRef = useRef(null);
  const uploadStripRef = useRef(null);
  const [imagePreview, setImagePreview] = useState({ open: false, src: '' });
  const [ytEditOpen, setYtEditOpen] = useState(false);
  const [ytTemp, setYtTemp] = useState('');
  const mountedRef = useRef(false);
  const restoredRef = useRef(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    try { return localStorage.getItem('quizAppTheme') || 'light'; } catch { return 'light'; }
  });
  
  // Apply theme on component mount
  useEffect(() => {
    document.documentElement.className = `theme-${currentTheme}`;
  }, [currentTheme]);
  
  const [autoNext, setAutoNext] = useState(false);
  const [showCorrectPreview, setShowCorrectPreview] = useState(true);
  const [fontChoice, setFontChoice] = useState('system');
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('quizAppSoundOn') !== 'false'; } catch { return true; }
  });
  const [textToSpeechOn, setTextToSpeechOn] = useState(() => {
    try { return localStorage.getItem('quizAppTextToSpeechOn') === 'true'; } catch { return false; }
  });
  const [fontSize, setFontSize] = useState(() => {
    try {
      const v = parseInt(localStorage.getItem('quizAppFontSize') || '', 10);
      return Number.isFinite(v) ? Math.min(28, Math.max(12, v)) : 16;
    } catch { return 16; }
  });
  const audioCtxRef = useRef(null);

  const currentQuestion = questions[currentQIndex];
  const progressPct = totalQuestions > 0 ? ((currentQIndex + 1) / totalQuestions) * 100 : 0;
  
  // Function to show browser notification
  const showNotification = (title, message) => {
    // Notifications are now disabled - function kept for compatibility
    return;
    
    try {
      // Check if browser supports notifications
      if ('Notification' in window) {
        // If permission already granted, show notification
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/favicon.ico'
          });
        }
        // If permission not denied, request it
        else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, {
                body: message,
                icon: '/favicon.ico'
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // On mount, restore from resumeDraft if provided
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (resumeDraft && resumeDraft.quizId === quiz.id) {
      setCurrentQIndex(Math.min(resumeDraft.currentQIndex || 0, Math.max(totalQuestions - 1, 0)));
      setAnswers(Array.isArray(resumeDraft.answers) && resumeDraft.answers.length === totalQuestions ? resumeDraft.answers : Array(totalQuestions).fill(null));
      setFavorites(Array.isArray(resumeDraft.favorites) && resumeDraft.favorites.length === totalQuestions ? resumeDraft.favorites : Array(totalQuestions).fill(false));
      setNotes(Array.isArray(resumeDraft.notes) && resumeDraft.notes.length === totalQuestions ? resumeDraft.notes : Array(totalQuestions).fill(''));
  const restoredPer = Number.isFinite(resumeDraft.perQSec) ? resumeDraft.perQSec : timePerQuestion;
  setPerQSec(restoredPer);
  const restored = Number.isFinite(resumeDraft.timeLeft) ? resumeDraft.timeLeft : restoredPer;
      setTimeLeft(restored);
      if (Array.isArray(resumeDraft.images) && resumeDraft.images.length === totalQuestions) setImages(resumeDraft.images);
      if (Array.isArray(resumeDraft.ytLinks) && resumeDraft.ytLinks.length === totalQuestions) setYtLinks(resumeDraft.ytLinks);
      const tSec = Number.isFinite(resumeDraft.totalSec) ? resumeDraft.totalSec : Math.max(restoredPer * Math.max(totalQuestions, 1), 30);
      const tLeft = Number.isFinite(resumeDraft.totalLeft) ? resumeDraft.totalLeft : tSec;
      setTotalSec(tSec);
      setTotalLeft(tLeft);
      setPaused(Boolean(resumeDraft.paused));
  if (typeof resumeDraft.fontChoice === 'string') setFontChoice(resumeDraft.fontChoice);
  if (Number.isFinite(resumeDraft.fontSize)) setFontSize(resumeDraft.fontSize);
      restoredRef.current = true;
    }
  }, [resumeDraft, quiz.id, totalQuestions, timePerQuestion]);

  // Initialize selected from existing answers on index change
  useEffect(() => {
    setSelected(answers[currentQIndex]);
    if (restoredRef.current) {
      // Skip resetting once immediately after a restore
      restoredRef.current = false;
    } else {
      setTimeLeft(perQSec);
    }
    setGalleryIdx(0);
    
    // Text-to-speech for current question if enabled
    if (textToSpeechOn && 'speechSynthesis' in window && currentQuestion) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create a new speech utterance
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      
      // Speak the question
      window.speechSynthesis.speak(utterance);
    }
  }, [currentQIndex, perQSec, textToSpeechOn, currentQuestion]);

  // Per-question countdown timer
  useEffect(() => {
    if (!currentQuestion) return;
    if (paused) return;
    if (timeLeft <= 0) {
      // Auto-advance on timeout, saving draft and resetting timer
      const updated = [...answers];
      updated[currentQIndex] = selected;
      setAnswers(updated);
      if (currentQIndex < totalQuestions - 1) {
        setCurrentQIndex(i => i + 1);
    setTimeLeft(perQSec);
        persistDraft({ answers: updated, currentQIndex: currentQIndex + 1, timeLeft: perQSec });
      } else {
        setConfirmSubmitOpen(true);
      }
      return;
    }
    if (totalLeft <= 0) {
      setConfirmSubmitOpen(true);
      return;
    }
    const t = setTimeout(() => {
      setTimeLeft(tl => {
        const next = tl - 1;
        persistDraft({ timeLeft: Math.max(next, 0) });
        
        // Time notification removed (replaced with text-to-speech functionality)
        
        return next;
      });
      setTotalLeft(tl => {
        const next = tl - 1;
        persistDraft({ totalLeft: Math.max(next, 0) });
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft, totalLeft, currentQIndex, currentQuestion, paused]);

  const persistDraft = (draft = {}) => {
    if (!onDraftUpdate) return;
    const payload = {
      sessionId,
      quizId: quiz.id,
      quizTitle: quiz.title,
      totalQuestions,
      currentQIndex,
      answers,
      favorites,
      notes,
  images,
  ytLinks,
  perQSec,
  totalSec,
  totalLeft,
  paused,
  fontChoice,
  fontSize,
      timeLeft,
      ...draft,
    };
    onDraftUpdate(payload);
  };

  const handleSelect = (opt) => {
    const isCorrect = opt === currentQuestion.correctAnswer;
    
    // Different sounds for correct and wrong answers
    try {
      if (soundOn) {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        
        if (isCorrect) {
          // Correct answer - higher pitched, pleasant sound
          osc.frequency.value = 1320; // Higher frequency for success
        } else {
          // Wrong answer - lower pitched sound
          osc.frequency.value = 440; // Lower frequency for error
        }
        
        gain.gain.value = 0.05;
        osc.connect(gain); gain.connect(ctx.destination);
        const now = ctx.currentTime;
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {}
    setSelected(opt);
    const updated = [...answers];
    updated[currentQIndex] = opt;
    setAnswers(updated);
    persistDraft({ answers: updated });
    if (autoNext) {
      // slight delay for visual feedback
      setTimeout(() => {
        handleNext();
      }, 150);
    }
  };

  const toggleFavorite = () => {
    setFavorites(prev => {
      const next = prev.map((v, idx) => (idx === currentQIndex ? !v : v));
      persistDraft({ favorites: next });
      return next;
    });
  };

  const handlePrev = () => {
    if (currentQIndex === 0) return;
    setCurrentQIndex(i => i - 1);
  persistDraft({ currentQIndex: currentQIndex - 1 });
  };

  const finalizeAndSubmit = () => {
    const correctAnswers = questions.map(q => q.correctAnswer);
    const correctCount = answers.reduce((acc, ans, idx) => acc + (ans && correctAnswers[idx] === ans ? 1 : 0), 0);
    const skippedCount = answers.filter(a => a === null).length;
    const wrongCount = totalQuestions - correctCount - skippedCount;
    const favoriteCount = favorites.filter(Boolean).length;
    const timeUsed = Math.max((totalSec || 0) - (totalLeft || 0), 0);
    const payload = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: correctCount,
      totalQuestions,
      skippedCount,
      wrongCount,
      favoriteCount,
      answers,
      correctAnswers,
      notes,
      images,
      ytLinks,
      totalSec,
      totalLeft,
      timeUsed,
      questions: questions.map((q, i) => ({ 
        question: q.question, 
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: answers[i],
        explanation: q.explanation
      })),
      wrongQuestions: questions
        .map((q, i) => ({ 
          question: q.question, 
          options: q.options,
          correctAnswer: q.correctAnswer,
          userAnswer: answers[i],
          explanation: q.explanation
        }))
        .filter((q, i) => answers[i] && answers[i] !== q.correctAnswer),
      timestamp: new Date().toISOString(),
    };
    if (onDraftUpdate) onDraftUpdate(null);
    onQuizComplete(payload);
  };

  const fmt = (s) => {
    const v = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(v / 60);
    const ss = String(v % 60).padStart(2, '0');
    return `${m}:${ss}`;
  };

  // Font stacks
  const fontMap = {
    system: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  };

  // YouTube helpers
  const getYouTubeId = (url) => {
    const m = (url || '').match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : '';
  };
  const isYouTubeValid = (url) => {
    const u = url || '';
    if (!u) return false;
    return !!getYouTubeId(u);
  };

  const handleNext = () => {
    const updated = [...answers];
    updated[currentQIndex] = selected; // may be null if not selected
    setAnswers(updated);
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex(i => i + 1);
  persistDraft({ answers: updated, currentQIndex: currentQIndex + 1, timeLeft: perQSec });
  setGalleryIdx(0);
    } else {
      setConfirmSubmitOpen(true);
    }
  };

  const handleClose = () => setConfirmCloseOpen(true);

  if (!currentQuestion) {
    return (
      <div className="mt-4 p-4 border border-red-200 rounded-2xl bg-red-50 text-red-800 text-center w-full">
        <p>No questions found for this quiz.</p>
        <button onClick={() => onQuizComplete(0, 0, quiz.title)} className="mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">Back to Quizzes</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6" 
         style={{ 
           fontFamily: fontMap[fontChoice], 
           fontSize: `${fontSize}px`,
           backgroundColor: 'var(--bg-primary)',
           color: 'var(--text-primary)'
         }}>
      
      {/* Top bar with timer + controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full  flex items-center justify-center" title="Total quiz time">
            <div className="font-bold text-red-600">{fmt(totalLeft)}</div>
          </div>
          <button 
            aria-label="play-pause" 
            onClick={() => setPaused(p => { const np = !p; persistDraft({ paused: np }); return np; })} 
            className={`p-2 rounded-full flex items-center justify-center ${paused ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}
            title={paused ? "Play Quiz" : "Pause Quiz"}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
        <div className="flex items-center gap-3 text-gray-500">
          <button className="p-1 rounded hover:bg-gray-100" aria-label="favorite" onClick={toggleFavorite} title={favorites[currentQIndex] ? 'Unfavorite' : 'Favorite'}>
            <Star size={18} className={favorites[currentQIndex] ? 'text-amber-500' : ''} fill={favorites[currentQIndex] ? 'currentColor' : 'none'} />
          </button>
          {/* Back button removed - now controlled through settings */}
          <button
            className="p-1 rounded hover:bg-gray-100"
            aria-label="volume"
            title={soundOn ? 'Sound: On' : 'Sound: Off'}
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              try { localStorage.setItem('quizAppSoundOn', String(next)); } catch {}
              persistDraft({ soundOn: next });
            }}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          
          {/* Text-to-Speech icon */}
          <button
            className="p-1 rounded hover:bg-gray-100"
            aria-label="text-to-speech"
            title={textToSpeechOn ? 'Text-to-Speech: On' : 'Text-to-Speech: Off'}
            onClick={() => {
              const next = !textToSpeechOn;
              setTextToSpeechOn(next);
              try { localStorage.setItem('quizAppTextToSpeechOn', String(next)); } catch {}
              persistDraft({ textToSpeechOn: next });
            }}
          >
            {/* Text-to-speech image icon */}
            <img 
              src="/src/assets/image.png" 
              alt="Text to Speech" 
              width="18" 
              height="18" 
              className={`${textToSpeechOn ? 'opacity-100' : 'opacity-60'} transition-opacity`}
              style={{
                filter: textToSpeechOn ? 'none' : 'grayscale(100%)',
                transition: 'filter 0.2s ease'
              }}
            />
          </button>

          {/* Text to speech icon removed as requested */}
          
          {/* Share, Settings, and Question Edit buttons side-by-side */}
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            aria-label="share" 
            title="Share Quiz" 
            onClick={() => setShareOpen(true)}
          >
            <Share2 size={18} />
          </button>
          
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            aria-label="settings" 
            title="Settings" 
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>
          
          <button 
            className="p-1 rounded hover:bg-gray-100" 
            aria-label="edit-question" 
            title="Edit Current Question" 
            onClick={() => {
              const currentQuestion = questions[currentQIndex];
              if (currentQuestion) {
                setEditQuestionText(currentQuestion.question);
                setEditOptions([...currentQuestion.options]);
                setEditCorrectAnswer(currentQuestion.correctAnswer);
                setEditExplanation(currentQuestion.explanation || '');
                setEditingQuestion(true);
              }
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Progress bar with centered count text inside the fill */}
      <div className="mb-4">
        <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="bg-sky-400 h-full rounded-full transition-all duration-500 ease-in-out animate-blue-pulse flex items-center justify-center" style={{ width: `${progressPct}%` }}>
            <span className="text-[10px] font-bold text-white select-none">
              {currentQIndex + 1} / {totalQuestions}
            </span>
          </div>
        </div>
      </div>

      {/* Per-question timer display */}
      <div className="mb-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="relative inline-block w-12 h-12">
            {/* Animated progress circle using SVG */}
            <svg width="48" height="48" viewBox="0 0 48 48" className="absolute top-0 left-0">
              <circle 
                cx="24" 
                cy="24" 
                r="18" 
                fill="none" 
                stroke="#EF4444" 
                strokeWidth="3"
                strokeDasharray="113" 
                strokeDashoffset={113 - (timeLeft / perQSec) * 113}
                transform="rotate(-90 24 24)"
              />
            </svg>
          
          {/* Timer text in the center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-medium">
              <span className="font-bold text-sm text-red-600">{timeLeft}</span>
            </div>
          </div>
          </div>
         
        </div>
      </div>

      {/* Question header */}
      <div className="flex items-start justify-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800 w-full text-center">{currentQuestion.question}</h3>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 mb-4">
        {currentQuestion.options.map((opt, idx) => {
          const isSelected = selected === opt;
          const isCorrectAnswer = opt === currentQuestion.correctAnswer;
          const isSelectedCorrect = selected === currentQuestion.correctAnswer;
          
          const base = 'w-full border rounded-xl px-4 py-3 transition text-center';
          
          let className = base;
          
          if (isSelected) {
            // User selected this option
            if (isCorrectAnswer) {
              // Selected option is correct - Green with dark text
              className += ' bg-green-200 border-green-500 text-black font-semibold shadow ring-2 ring-green-300';
            } else {
              // Selected option is wrong - Red with dark text
              className += ' bg-red-200 border-red-500 text-black font-semibold shadow ring-2 ring-red-300';
            }
          } else if (selected && !isSelectedCorrect && isCorrectAnswer) {
            // Show correct answer when user selected wrong - Green hint with dark text
            className += ' bg-green-100 border-green-400 text-black font-medium';
          } else {
            // Default unselected state - White with dark text
            className += ' bg-white border-gray-300 text-black hover:bg-gray-50 hover:border-gray-400';
          }
          
          return (
            <button
              key={idx}
              onClick={() => handleSelect(opt)}
              className={className}
            >
              {opt}
            </button>
          );
        })}
      </div>



       {/* Selected vs Correct preview + Explanation */}
       {selected && currentQuestion.explanation && (
        <div className="mb-4 rounded-lg p-3 text-sm text-gray-700">
          <div className="font-medium text-gray-800 mb-1"></div>
          <div>{currentQuestion.explanation}</div>
        </div>
      )}
      {/* // {selected && showCorrectPreview && (
      //   <div className="grid grid-cols-2 gap-3 mb-4">
      //     <div className="rounded-xl border border-emerald-200 bg-emerald-100 p-3 text-center">
      //       <div className="text-lg font-semibold text-emerald-700 truncate">{selected}</div>
      //       <div className="text-xs text-gray-500 mt-1">Your pick</div>
      //     </div>
      //     <div className="rounded-xl border border-amber-200 bg-amber-100 p-3 text-center">
      //       <div className="text-lg font-semibold text-amber-700 truncate">{currentQuestion.correctAnswer}</div>
      //       <div className="text-xs text-gray-500 mt-1">Correct</div>
      //     </div>
      //   </div>
      // )} */}
      

  {/* Notes input removed */}

      {/* Image Upload Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          
          
        </div>
        <div ref={uploadStripRef} className="w-full overflow-x-auto hide-scrollbar">
          <div className="flex gap-3 min-w-max py-1">
            {Array.from({ length: 10 }).map((_, slot) => {
              const src = images[currentQIndex]?.[slot];
              return (
                <div key={slot} className="w-36 h-32 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0">
                  {src ? (
                    <img
                      src={src}
                      alt={`thumb-${slot+1}`}
                      className="max-w-full max-h-full object-contain cursor-zoom-in"
                      onClick={() => setImagePreview({ open: true, src })}
                      onDoubleClick={() => { setYtTemp(ytLinks[currentQIndex] || ''); setYtEditOpen(true); }}
                    />
                  ) : (
                    <label className="w-full h-full flex items-center justify-center text-sm text-gray-600 cursor-pointer">
                    
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUrl = String(reader.result || '');
                            setImages(prev => {
                              const copy = prev.map(a => Array.isArray(a) ? [...a] : Array(10).fill(null));
                              copy[currentQIndex][slot] = dataUrl;
                              persistDraft({ images: copy });
                              return copy;
                            });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact media gallery (swipeable) */}
      {(() => {
        const imgs = (images[currentQIndex] || []).filter(Boolean);
        if (imgs.length === 0) return null;
        const idx = Math.min(galleryIdx, Math.max(imgs.length - 1, 0));
        const onPrev = () => setGalleryIdx(i => (i - 1 + imgs.length) % imgs.length);
        const onNext = () => setGalleryIdx(i => (i + 1) % imgs.length);
        const onTouchStart = (e) => { touchRef.current.x = e.touches[0].clientX; };
        const onTouchEnd = (e) => { const dx = e.changedTouches[0].clientX - touchRef.current.x; if (Math.abs(dx) > 40) { if (dx < 0) onNext(); else onPrev(); } };
        return (
          <div className="mb-4">
            <div className="relative aspect-video w-full bg-black/5 rounded overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <img
                src={imgs[idx]}
                alt={`media-${idx+1}`}
                className="w-full h-full object-contain cursor-zoom-in"
                onClick={() => {
                  if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
                  clickTimerRef.current = setTimeout(() => { setImagePreview({ open: true, src: imgs[idx] }); clickTimerRef.current = null; }, 220);
                }}
                onDoubleClick={() => {
                  if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
                  setYtTemp(ytLinks[currentQIndex] || '');
                  setYtEditOpen(true);
                }}
              />
              <button onClick={onPrev} className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full px-2 py-1 text-sm">‹</button>
              <button onClick={onNext} className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full px-2 py-1 text-sm">›</button>
            </div>
            <div className="mt-1 flex justify-center gap-1">
              {imgs.map((_, i) => (
                <span key={i} className={`inline-block w-2 h-2 rounded-full ${i === idx ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* YouTube link input + preview */}
      {/* <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-1"></label>
        <input
          type="url"
          value={ytLinks[currentQIndex]}
          onChange={(e) => {
            const v = e.target.value;
            setYtLinks(prev => {
              const next = prev.slice();
              next[currentQIndex] = v;
              persistDraft({ ytLinks: next });
              return next;
            });
          }}
          placeholder=""
          className={`w-full p-2 border rounded-md ${(() => { const url = ytLinks[currentQIndex] || ''; if (!url) return ''; const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/); return url && !m ? 'border-red-400' : ''; })()}`}
        />
        {(() => {
          const url = ytLinks[currentQIndex] || '';
          const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
          const id = m ? m[1] : '';
          if (!url) return null;
          if (!id) return (<div className="text-xs text-red-600 mt-1">Invalid YouTube link. Use formats like https://youtu.be/ID or https://www.youtube.com/watch?v=ID</div>);
          const embed = `https://www.youtube.com/embed/${id}`;
          return (
            <div className="mt-2 aspect-video w-full bg-black/5 rounded overflow-hidden">
              <iframe title="youtube" src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full"></iframe>
            </div>
          );
        })()}
      </div> */}

     

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button 
          onClick={handlePrev} 
          className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center justify-center disabled:opacity-50 w-14 h-10" 
          disabled={currentQIndex === 0}
          title="Previous Question"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={handleClose} 
          className="p-2 rounded-lg bg-rose-400 text-white hover:bg-rose-600 flex items-center justify-center w-14 h-10"
          title="Close Quiz"
        >
          <XIcon size={20} />
        </button>
        <button 
          onClick={handleNext} 
          className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-emerald-700 flex items-center justify-center w-14 h-10"
          title={currentQIndex === totalQuestions - 1 ? "Submit Quiz" : "Next Question"}
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <ConfirmDialog
        open={confirmCloseOpen}
        title="Close & Submit"
        message="Submit your attempt now? You can also leave and resume later from the dashboard."
        confirmText="Submit"
        onConfirm={() => { setConfirmCloseOpen(false); finalizeAndSubmit(); }}
        onCancel={() => setConfirmCloseOpen(false)}
      />
      <ConfirmDialog
        open={confirmSubmitOpen}
        title="Submit Quiz"
        message="Submit your answers now?"
        confirmText="Submit"
        onConfirm={() => { setConfirmSubmitOpen(false); finalizeAndSubmit(); }}
        onCancel={() => setConfirmSubmitOpen(false)}
      />

      {/* Image Preview Modal */}
      {imagePreview.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setImagePreview({ open: false, src: '' })}>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={imagePreview.src} alt="preview" className="w-full h-auto object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* YouTube Link Edit Modal (double-click to open) */}
      {ytEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="px-4 py-3 border-b">
              <h4 className="text-base font-semibold text-gray-800">Edit YouTube Link</h4>
            </div>
            <div className="px-4 py-4 space-y-2 text-sm">
              <input
                autoFocus
                type="url"
                value={ytTemp}
                onChange={(e) => setYtTemp(e.target.value)}
                placeholder="https://youtu.be/ID or https://www.youtube.com/watch?v=ID"
                className={`w-full p-2 border rounded-md ${ytTemp && !isYouTubeValid(ytTemp) ? 'border-red-400' : ''}`}
              />
              {(() => {
                const u = ytTemp || '';
                if (!u) return null;
                const id = getYouTubeId(u);
                if (!id) return (<div className="text-xs text-red-600">Invalid YouTube link</div>);
                const embed = `https://www.youtube.com/embed/${id}`;
                return (
                  <div className="mt-2 aspect-video w-full bg-black/5 rounded overflow-hidden">
                    <iframe title="yt-preview" src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="w-full h-full"></iframe>
                  </div>
                );
              })()}
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setYtEditOpen(false)} className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => {
                  setYtLinks(prev => {
                    const next = prev.slice();
                    next[currentQIndex] = ytTemp || '';
                    persistDraft({ ytLinks: next });
                    return next;
                  });
                  setYtEditOpen(false);
                }}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl animate-fade-in-scale">
            <div className="px-4 py-3 border-b">
              <h4 className="text-base font-semibold text-gray-800">Quiz Settings</h4>
            </div>
            <div className="px-4 py-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <label>Time per question (sec)</label>
                <input type="number" min={5} max={300} value={perQSec} onChange={(e) => setPerQSec(Math.min(300, Math.max(5, parseInt(e.target.value || '0', 10) || perQSec)))} className="w-24 p-1 border rounded-md text-right focus:ring-2 focus:ring-blue-400 transition-transform transform focus:scale-105" />
              </div>
              <div className="flex items-center justify-between">
                <label>Total quiz time (sec)</label>
                <input type="number" min={30} max={36000} value={totalSec} onChange={(e) => setTotalSec(Math.min(36000, Math.max(30, parseInt(e.target.value || '0', 10) || totalSec)))} className="w-32 p-1 border rounded-md text-right focus:ring-2 focus:ring-blue-400 transition-transform transform focus:scale-105" />
              </div>
              <label className="flex items-center justify-between gap-3">
                <span>Sound effects</span>
                <input type="checkbox" checked={soundOn} onChange={(e) => { setSoundOn(e.target.checked); try { localStorage.setItem('quizAppSoundOn', String(e.target.checked)); } catch {} }} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Text-to-Speech</span>
                <input type="checkbox" checked={textToSpeechOn} onChange={(e) => { setTextToSpeechOn(e.target.checked); try { localStorage.setItem('quizAppTextToSpeechOn', String(e.target.checked)); } catch {} }} />
              </label>
              {textToSpeechOn && (
                <div className="flex items-center justify-between">
                  <label>Voice</label>
                  <select value={ttsVoice} onChange={e => { setTtsVoice(e.target.value); try { localStorage.setItem('quizAppTtsVoice', e.target.value); } catch {} }} className="border rounded p-1 text-sm focus:ring-2 focus:ring-blue-400 transition-transform transform focus:scale-105">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <label>Font</label>
                <select value={fontChoice} onChange={(e) => setFontChoice(e.target.value)} className="border rounded p-1 text-sm focus:ring-2 focus:ring-blue-400 transition-transform transform focus:scale-105">
                  <option value="system">System (Sans)</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>
               <div className="flex items-center justify-between">
                <label>Animation Style Option</label>
                <select value={animationStyle} onChange={e => setAnimationStyle(e.target.value)} className="border rounded p-1 text-sm focus:ring-2 focus:ring-blue-400 transition-transform transform focus:scale-105">
                  <option value="fade">Fade</option>
                  <option value="scale">Scale</option>
                  <option value="slide">Slide</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label>Animation Style Correct Answer</label>
                <select value={animationStyle} onChange={e => setAnimationStyle(e.target.value)} className="border rounded p-1 text-sm focus:ring-2 focus:ring-blue-400 transition-transform transform focus:scale-105">
                  <option value="fade">Fade</option>
                  <option value="scale">Scale</option>
                  <option value="slide">Slide</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label>Animation Style For Wrong Answer</label>
                <select value={animationStyle} onChange={e => setAnimationStyle(e.target.value)} className="border rounded p-1 text-sm focus:ring-2 focus:ring-blue-400 transition-transform transform focus:scale-105">
                  <option value="fade">Fade</option>
                  <option value="scale">Zoom in</option>
                  <option value="slide">POP UP</option>
                    <option value="none">Shake</option>
                  <option value="none">Heart Beat</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label>Font size (px)</label>
                <input type="number" min={12} max={28} value={fontSize} onChange={(e) => setFontSize(Math.min(28, Math.max(12, parseInt(e.target.value || '0', 10) || fontSize)))} className="w-20 p-1 border rounded-md text-right focus:ring-2 focus:ring-blue-400 transition-transform transform focus:scale-105" />
              </div>
              <label className="flex items-center justify-between gap-3">
                <span>Auto next on select</span>
                <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Show correct preview</span>
                <input type="checkbox" checked={showCorrectPreview} onChange={(e) => setShowCorrectPreview(e.target.checked)} />
              </label>
              <div className="text-[11px] text-gray-500">Timer changes apply to current/next questions. Auto next will move forward right after a selection.</div>
              
              {/* Logout option */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setConfirmLogoutOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-transform transform hover:scale-105"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={() => { setSettingsOpen(false); }} className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-transform transform hover:scale-105">Close</button>
              <button onClick={() => { 
                setSettingsOpen(false); 
                setTimeLeft(perQSec); 
                setTotalLeft(totalSec); 
                try { 
                  localStorage.setItem('quizAppSoundOn', String(soundOn)); 
                  localStorage.setItem('quizAppTextToSpeechOn', String(textToSpeechOn)); 
                  localStorage.setItem('quizAppFontSize', String(fontSize)); 
                } catch {}; 
                persistDraft({ 
                  perQSec, 
                  totalSec, 
                  totalLeft: totalSec, 
                  fontChoice, 
                  soundOn, 
                  textToSpeechOn,
                  fontSize 
                })
              }} className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-transform transform hover:scale-105">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Question {currentQIndex + 1}</h3>
                <button 
                  onClick={() => setEditingQuestion(false)} 
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label="close"
                >
                  <XIcon size={20} />
                </button>
              </div>
            </div>
            
            <div className="px-4 py-4 space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea 
                  value={editQuestionText} 
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows="3"
                  placeholder="Enter question text..."
                />
              </div>
              
              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                {editOptions.map((option, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={option} 
                      onChange={(e) => {
                        const newOptions = [...editOptions];
                        newOptions[idx] = e.target.value;
                        setEditOptions(newOptions);
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                      placeholder={`Option ${idx + 1}`}
                    />
                    {editOptions.length > 2 && (
                      <button 
                        onClick={() => {
                          const newOptions = editOptions.filter((_, i) => i !== idx);
                          setEditOptions(newOptions);
                          if (editCorrectAnswer === option) {
                            setEditCorrectAnswer('');
                          }
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {editOptions.length < 6 && (
                  <button 
                    onClick={() => setEditOptions([...editOptions, ''])}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Option
                  </button>
                )}
              </div>
              
              {/* Correct Answer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                <select 
                  value={editCorrectAnswer} 
                  onChange={(e) => setEditCorrectAnswer(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select correct answer...</option>
                  {editOptions.filter(opt => opt.trim()).map((option, idx) => (
                    <option key={idx} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                <textarea 
                  value={editExplanation} 
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows="2"
                  placeholder="Enter explanation for the correct answer..."
                />
              </div>
            </div>
            
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button 
                onClick={() => setEditingQuestion(false)} 
                className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Update the question in the quiz
                  if (editQuestionText.trim() && editOptions.filter(opt => opt.trim()).length >= 2 && editCorrectAnswer) {
                    const updatedQuestions = [...questions];
                    updatedQuestions[currentQIndex] = {
                      ...updatedQuestions[currentQIndex],
                      question: editQuestionText.trim(),
                      options: editOptions.filter(opt => opt.trim()),
                      correctAnswer: editCorrectAnswer,
                      explanation: editExplanation.trim()
                    };
                    
                    // Update the quiz object
                    quiz.questions = updatedQuestions;
                    
                    // Clear selected answer if it's no longer valid
                    if (!editOptions.includes(selected)) {
                      setSelected(null);
                      const newAnswers = [...answers];
                      newAnswers[currentQIndex] = null;
                      setAnswers(newAnswers);
                    }
                    
                    setEditingQuestion(false);
                  } else {
                    alert('Please fill in all required fields: question text, at least 2 options, and correct answer.');
                  }
                }} 
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="px-4 py-3 border-b">
              <h4 className="text-base font-semibold text-gray-800">Share Quiz Results</h4>
            </div>
            <div className="px-4 py-4 space-y-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 mb-2">🎯 {quiz.title}</div>
                <div className="text-2xl font-bold text-blue-600">
                  {correctCount} / {quiz.questions.length}
                </div>
                <div className="text-gray-600">
                  {Math.round((correctCount / quiz.questions.length) * 100)}% Score
                </div>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    const shareText = `I just scored ${correctCount}/${quiz.questions.length} (${Math.round((correctCount / quiz.questions.length) * 100)}%) on "${quiz.title}" quiz! 🎯`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Quiz Results',
                        text: shareText
                      });
                    } else {
                      navigator.clipboard.writeText(shareText);
                      alert('Results copied to clipboard!');
                    }
                  }}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                  📱 Share Results
                </button>
                
                <button 
                  onClick={() => {
                    const quizUrl = window.location.href;
                    if (navigator.share) {
                      navigator.share({
                        title: quiz.title,
                        text: `Try this quiz: ${quiz.title}`,
                        url: quizUrl
                      });
                    } else {
                      navigator.clipboard.writeText(quizUrl);
                      alert('Quiz link copied to clipboard!');
                    }
                  }}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                >
                  🔗 Share Quiz Link
                </button>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end">
              <button onClick={() => setShareOpen(false)} className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Modal */}
      {themeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="px-4 py-3 border-b">
              <h4 className="text-base font-semibold text-gray-800">Choose Theme</h4>
            </div>
            <div className="px-4 py-4 space-y-3">
              {[
                { id: 'light', name: 'Light', icon: '☀️', desc: 'Clean and bright' },
                { id: 'dark', name: 'Dark', icon: '🌙', desc: 'Easy on the eyes' },
                { id: 'blue', name: 'Ocean Blue', icon: '🌊', desc: 'Calm and focused' },
                { id: 'green', name: 'Forest Green', icon: '🌲', desc: 'Natural and fresh' }
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                    try {
                      localStorage.setItem('quizAppTheme', theme.id);
                      // Apply theme immediately
                      document.documentElement.className = `theme-${theme.id}`;
                    } catch {}
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    currentTheme === theme.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{theme.icon}</span>
                    <div>
                      <div className="font-medium text-gray-800">{theme.name}</div>
                      <div className="text-xs text-gray-500">{theme.desc}</div>
                    </div>
                    {currentTheme === theme.id && (
                      <span className="ml-auto text-blue-500">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setThemeOpen(false)} className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">Close</button>
              <button 
                onClick={() => {
                  setThemeOpen(false);
                  // Apply theme changes here
                  document.documentElement.className = `theme-${currentTheme}`;
                  persistDraft({ theme: currentTheme });
                  
                  // Force UI update by toggling a class
                  document.body.classList.add('theme-transition');
                  setTimeout(() => document.body.classList.remove('theme-transition'), 100);
                }} 
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Apply Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;