import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [testSession, setTestSession] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  useEffect(() => {
    if (testSession && test?.duration && testStarted) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testSession, test, testStarted]);

  // Utility function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchTestDetails = async () => {
    try {
      const response = await axiosInstance.get(`/student/tests/${testId}`);
      let testData = response.data.test;
      
      // Apply randomization if enabled
      if (testData.randomizeQuestions) {
        // Create question order mapping
        const questionIndices = testData.questions.map((_, index) => index);
        const shuffledIndices = shuffleArray(questionIndices);
        
        // Reorder questions and update their indices
        testData.questions = shuffledIndices.map((originalIndex, newIndex) => ({
          ...testData.questions[originalIndex],
          originalIndex, // Keep track of original index for submission
          displayIndex: newIndex
        }));
      }
      
      // Apply option randomization if enabled
      if (testData.randomizeOptions) {
        testData.questions = testData.questions.map(question => {
          const optionIndices = question.options.map((_, index) => index);
          const shuffledIndices = shuffleArray(optionIndices);
          
          return {
            ...question,
            options: shuffledIndices.map(originalIndex => question.options[originalIndex]),
            optionMapping: shuffledIndices, // Keep track of original option indices
            originalCorrectIndex: question.correctAnswerIndex // Store original correct answer
          };
        });
      }
      
      setTest(testData);
      // Initialize answers array
      setAnswers(testData.questions.map(() => ({ selectedOptionIndex: null })));
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch test');
      navigate('/tests');
    }
  };

  const startTest = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/student/tests/${testId}/start`);
      setTestSession({
        submissionId: response.data.submissionId,
        startTime: new Date(response.data.startTime)
      });
      setTestStarted(true);
      toast.success('Test started successfully');
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start test');
      setLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const elapsed = Math.floor((now - testSession.startTime) / 1000); // seconds elapsed
      const totalTime = test.duration * 60; // total time in seconds
      return Math.max(0, totalTime - elapsed);
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    timerRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleAutoSubmit();
      }
    }, 1000);
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    
    toast.warning('Time is up! Auto-submitting test...');
    await handleSubmit(true);
  };

  const handleOptionSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      const question = test.questions[questionIndex];
      
      // Store the displayed option index for UI purposes
      // The actual mapping will be handled during submission
      newAnswers[questionIndex] = {
        selectedOptionIndex: optionIndex, // Store displayed option index
        questionIndex: question.originalIndex !== undefined ? question.originalIndex : questionIndex,
        actualOptionIndex: test.randomizeOptions && question.optionMapping ? 
          question.optionMapping[optionIndex] : optionIndex // Store actual option index
      };
      return newAnswers;
    });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting) return;
    
    // Filter out unanswered questions and prepare submission data
    const submittedAnswers = answers
      .map((answer, index) => ({
        questionIndex: answer.questionIndex !== undefined ? answer.questionIndex : index,
        selectedOptionIndex: answer.actualOptionIndex !== undefined ? 
          answer.actualOptionIndex : answer.selectedOptionIndex
      }))
      .filter(answer => answer.selectedOptionIndex !== null);
    
    if (!isAutoSubmit && submittedAnswers.length === 0) {
      toast.error('Please answer at least one question');
      return;
    }

    setSubmitting(true);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      const response = await axiosInstance.post(`/student/tests/${testId}/submit`, {
        submittedAnswers
      });

      toast.success('Test submitted successfully');
      
      // Show success message with review option if allowed
      if (test.allowReview) {
        const reviewNow = window.confirm(
          'Test submitted successfully! Would you like to review your answers now?'
        );
        if (reviewNow) {
          navigate(`/test-review/${testId}`);
        } else {
          navigate('/test-records');
        }
      } else {
        navigate('/test-records');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit test');
      setSubmitting(false);
      
      // Restart timer if submission failed and not auto-submit
      if (!isAutoSubmit && testSession && test?.duration) {
        startTimer();
      }
    }
  };

  const handleExitTest = () => {
    if (testStarted) {
      const confirmExit = window.confirm(
        'Are you sure you want to exit? Your progress will be lost and this will count as an attempt.'
      );
      if (!confirmExit) return;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    navigate('/tests');
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Show test start screen if test hasn't been started yet
  if (!testStarted) {
    return (
      <div className="container-padding safe-top safe-bottom min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{test.title}</h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-800 font-semibold">Questions</div>
                  <div className="text-2xl font-bold text-blue-900">{test.questions?.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-800 font-semibold">Total Marks</div>
                  <div className="text-2xl font-bold text-green-900">{test.totalMarks}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-orange-800 font-semibold">Duration</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {test.duration ? `${test.duration} min` : 'No limit'}
                  </div>
                </div>
              </div>

              {test.instructions && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg text-left">
                  <h2 className="font-semibold text-blue-800 mb-2">📋 Instructions:</h2>
                  <p className="text-blue-700 leading-relaxed">{test.instructions}</p>
                </div>
              )}

              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
                <ul className="text-yellow-700 text-sm space-y-1 text-left">
                  <li>• Once you start the test, the timer will begin automatically</li>
                  <li>• You cannot pause the test once started</li>
                  <li>• The test will auto-submit when time expires</li>
                  <li>• Make sure you have a stable internet connection</li>
                  {test.maxAttempts && (
                    <li>• You have {test.maxAttempts} attempt(s) for this test</li>
                  )}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleExitTest}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={startTest}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
              Start Online Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-padding safe-top safe-bottom min-h-screen">
      {/* Mobile-optimized header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{test.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {test.questions?.length} questions • {test.totalMarks} marks
            </p>
          </div>
          
          {/* Mobile-optimized timer */}
          {test.duration && (
            <div className="flex-shrink-0">
              <div className={`px-3 sm:px-4 py-2 rounded-lg text-center ${
                timeLeft <= 300 ? 'bg-red-100 text-red-800' : 
                timeLeft <= 600 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-blue-100 text-blue-800'
              }`}>
                <div className="text-xs sm:text-sm font-medium">Time Left</div>
                <div className="text-lg sm:text-xl font-bold">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(answers.filter(a => a.selectedOptionIndex !== null).length / test.questions.length) * 100}%` 
            }}
          ></div>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Progress: {answers.filter(a => a.selectedOptionIndex !== null).length} of {test.questions.length} questions answered
        </div>
      </div>

      {/* Mobile-optimized questions */}
      <div className="space-y-4 sm:space-y-6">
        {test.questions.map((question, questionIndex) => (
          <div key={questionIndex} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold px-2 py-1 rounded mr-2">
                  Q{questionIndex + 1}
                </span>
                {question.questionText}
              </h3>
              <div className="mt-2 text-xs sm:text-sm text-gray-500">
                Worth {question.marks} mark{question.marks !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Mobile-optimized options */}
            <div className="space-y-2 sm:space-y-3">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`flex items-start p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    answers[questionIndex]?.selectedOptionIndex === optionIndex
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    checked={answers[questionIndex]?.selectedOptionIndex === optionIndex}
                    onChange={() => handleOptionSelect(questionIndex, optionIndex)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={submitting}
                  />
                  <span className="text-sm sm:text-base text-gray-900 leading-relaxed flex-1">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded mr-2">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile-optimized submit section */}
      <div className="mt-6 sm:mt-8 sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 -mx-4 sm:-mx-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center">
          <div className="text-sm text-gray-600">
            Answered: {answers.filter(a => a.selectedOptionIndex !== null).length} of {test.questions?.length} questions
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleExitTest}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Exit Test
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-white font-medium transition-colors text-sm ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Submitting...' : '📤 Submit Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
