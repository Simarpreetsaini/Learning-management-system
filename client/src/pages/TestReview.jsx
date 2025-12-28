import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TestReview = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);

  useEffect(() => {
    fetchReview();
  }, [testId]);

  const fetchReview = async () => {
    try {
      const response = await axiosInstance.get(`/student/tests/${testId}/review`);
      setReview(response.data.review);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch test review');
      navigate('/tests');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{review.test.title}</h1>
          <div className="text-lg">
            Score: <span className="font-semibold">{review.submission.score}/{review.test.totalMarks}</span>
            <span className="ml-2 text-gray-600">
              ({((review.submission.score / review.test.totalMarks) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
        <div className="mt-2 text-gray-600">
          <p>Time Taken: {Math.floor(review.submission.timeTaken)} minutes</p>
          <p>Submitted: {new Date(review.submission.submissionDate).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-8">
        {review.questions.map((question, index) => (
          <div key={index} className={`bg-white p-6 rounded-lg shadow border-l-4 
            ${question.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">
                {index + 1}. {question.questionText}
              </h3>
              <div className="text-sm">
                <span className={question.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {question.marksObtained}/{question.totalMarks} marks
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {question.options.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className={`p-3 rounded-lg border ${
                    optIndex === question.correctAnswerIndex
                      ? 'bg-green-50 border-green-500'
                      : optIndex === question.studentAnswerIndex && !question.isCorrect
                      ? 'bg-red-50 border-red-500'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">
                      {optIndex === question.correctAnswerIndex && (
                        <span className="text-green-600">✓</span>
                      )}
                      {optIndex === question.studentAnswerIndex && !question.isCorrect && (
                        <span className="text-red-600">✗</span>
                      )}
                    </span>
                    <span>{option}</span>
                  </div>
                </div>
              ))}
            </div>

            {!question.isCorrect && (
              <div className="mt-4 text-sm text-green-700">
                <span className="font-medium">Correct Answer:</span> {question.options[question.correctAnswerIndex]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => navigate('/tests')}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Back to Tests
        </button>
      </div>
    </div>
  );
};

export default TestReview;
