import React, { useState, useEffect } from "react";
import { Play, Pause } from 'lucide-react';

// Local Storage Key for favorite questions
const FAVORITE_QUESTIONS_KEY = 'quizAppFavoriteQuestions';

const ResultPage = ({ quizResult, onClose, onReplay, allResults = [], onLogout }) => {
  // Use the actual quiz result data if provided, otherwise use sample data
  const result = quizResult || {
    quizTitle: "Sample Quiz",
    score: 1,
    totalQuestions: 5,
    timeUsed: 33,
    timestamp: new Date().toISOString(),
    questions: [],
    wrongQuestions: [],
    quizId: "sample-quiz-id"
  };

  // Initialize state for favorite questions and play/pause
  const [favoriteQuestions, setFavoriteQuestions] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Load favorite questions from localStorage when component mounts
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITE_QUESTIONS_KEY);
      if (storedFavorites) {
        setFavoriteQuestions(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Error loading favorite questions:", error);
    }
  }, []);
  
  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITE_QUESTIONS_KEY, JSON.stringify(favoriteQuestions));
    } catch (error) {
      console.error("Error saving favorite questions:", error);
    }
  }, [favoriteQuestions]);

  // Get favorite questions for current quiz
  const quizFavorites = favoriteQuestions.filter(fav => fav.quizId === result.quizId);
  
  const handleReplay = (type) => {
    console.log(`Replaying quiz (${type}):`, result.quizTitle);
    if (onReplay) {
      // Pass all necessary data to the parent component
      onReplay({ 
        replayType: type,
        quizId: result.quizId,
        quizTitle: result.quizTitle,
        totalQuestions: result.totalQuestions,
        score: result.score,
        timeUsed: result.timeUsed,
        questions: result.questions || [],
        wrongQuestions: result.wrongQuestions || [],
        favoriteQuestions: favoriteQuestions.filter(fav => fav.quizId === result.quizId)
      });
    }
  };
  
  const handleFavorite = (question) => {
    const questionId = question.id || `q-${Date.now()}`;
    const quizId = result.quizId || "default-quiz";
    
    // Check if this question is already in favorites
    const existingIndex = favoriteQuestions.findIndex(
      q => q.questionId === questionId && q.quizId === quizId
    );
    
    if (existingIndex >= 0) {
      // Remove from favorites if already favorited
      setFavoriteQuestions(prevFavorites => 
        prevFavorites.filter((_, index) => index !== existingIndex)
      );
    } else {
      // Add to favorites
      setFavoriteQuestions(prevFavorites => [
        ...prevFavorites,
        {
          questionId,
          quizId,
          question: question.question || question.quizName,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  // Calculate percentage, wrong answers, and per-question time
  const percentage = Math.round((result.score / Math.max(result.totalQuestions || 1, 1)) * 100);
  const wrong = result.totalQuestions - result.score;
  
  // Calculate per-question time in seconds
  const perQuestionTime = result.totalQuestions > 0 && result.timeUsed 
    ? Math.round((result.timeUsed / result.totalQuestions) * 10) / 10 
    : 0;

  // Quiz history data preparation
  // Removed unused quiz history code to clean up


  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Quiz Report at the top */}
        <div className="bg-amber-50 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onClose}
              className="flex items-center justify-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Quiz Report
            </h2>
            <div className="w-16"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th colSpan="3" className="border border-gray-300 px-4 py-2 text-center bg-blue-50">
                    <div className="flex items-center justify-center gap-2">
                      <span>⏱️</span>
                      <span className="font-medium">Per Question Time: {perQuestionTime} sec</span>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Question</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">No.</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Answered</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{result.score}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button 
                      onClick={() => handleReplay('answered')} 
                      className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto" 
                      title="Replay answered questions"
                    >
                      <Play size={16} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Skipped</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{result.totalQuestions - (result.score + wrong)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button 
                      onClick={() => handleReplay('skipped')} 
                      className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto" 
                      title="Replay skipped questions"
                    >
                      <Play size={16} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Wrong</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{wrong}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button 
                      onClick={() => handleReplay('wrong')} 
                      className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto" 
                      title="Replay wrong questions"
                    >
                      <Play size={16} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Favorite</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{quizFavorites.length}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button 
                      onClick={() => handleReplay('favorite')} 
                      className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto" 
                      title="Replay favorite questions"
                    >
                      <Play size={16} />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">Total</td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-medium">{result.totalQuestions}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button 
                      onClick={() => handleReplay('all')} 
                      className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                      title="Replay all questions"
                    >
                      <Play size={16} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-center mt-4 text-sm text-amber-700">
            <span>🎉 Awesome job on completing the quiz! Your hard work is paying off. Keep up the fantastic work! 🎉</span>
          </div>
          {typeof result.timeUsed === 'number' && (
            <div className="text-center text-gray-600 mt-4">
              <span className="font-medium">Time Used:</span> {Math.floor(result.timeUsed / 60)}:{String(result.timeUsed % 60).padStart(2, '0')}
            </div>
          )}
        </div>
        {/* Quiz History below */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Quiz History</h3>
          <div className="flex flex-col gap-3">
            {allResults && allResults.length > 0 ? (
              allResults.map((quiz, idx) => (
                <div key={quiz.quizId || quiz.id || idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{quiz.quizTitle || quiz.title}</div>
                    <div className="text-xs text-gray-500">Score: {quiz.score} / {quiz.totalQuestions || (quiz.questions?.length ?? 0)}</div>
                    <div className="text-xs text-gray-400">{quiz.timestamp ? new Date(quiz.timestamp).toLocaleString() : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                      onClick={() => handleReplay('all', quiz)}
                    >
                      Replay
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                      onClick={() => handleDeleteHistory(idx)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400">No quiz history available.</div>
            )}
          </div>
        </div>
         
          
        </div>
      </div>
  );
};

export default ResultPage;
