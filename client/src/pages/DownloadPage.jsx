import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { paidNotesApi } from '../api/paidNotesApi';
import { toast } from '../utils/toast';

const DownloadPage = () => {
  const { orderId, accessKey } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (orderId && accessKey) {
      handleDownload();
    } else {
      setDownloadStatus('invalid');
      setLoading(false);
    }
  }, [orderId, accessKey]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const downloadUrl = paidNotesApi.downloadNote(orderId, accessKey);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadStatus('success');
      toast.success('Download started successfully!');
    } catch (error) {
      console.error('Download error:', error);
      if (error.response?.status === 403) {
        setDownloadStatus('expired');
      } else if (error.response?.status === 404) {
        setDownloadStatus('notfound');
      } else {
        setDownloadStatus('error');
      }
      toast.error('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (!resendEmail) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setResendLoading(true);
      await paidNotesApi.resendDownloadLink(resendEmail, orderId);
      toast.success('Download link has been sent to your email');
      setResendEmail('');
    } catch (error) {
      toast.error('Failed to resend download link');
    } finally {
      setResendLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Preparing your download...</h2>
          <p className="text-gray-600">Please wait while we verify your access.</p>
        </div>
      );
    }

    switch (downloadStatus) {
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Started!</h2>
            <p className="text-gray-600 mb-6">
              Your file download should start automatically. If it doesn't, click the button below.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Again
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Link Expired</h2>
            <p className="text-gray-600 mb-6">
              Your download link has expired. Please enter your email to receive a new link.
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleResendLink}
                  disabled={resendLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {resendLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 'notfound':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Not Found</h2>
            <p className="text-gray-600 mb-6">
              The download you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/paid-notes')}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Notes
            </button>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Download Link</h2>
            <p className="text-gray-600 mb-6">
              The download link is invalid or malformed. Please check your email for the correct link.
            </p>
            <button
              onClick={() => navigate('/paid-notes')}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Notes
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Failed</h2>
            <p className="text-gray-600 mb-6">
              Something went wrong while processing your download. Please try again or contact support.
            </p>
            <div className="space-x-4">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/paid-notes')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Notes
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700">
            If you're having trouble downloading your file, please check your email for the download link
            or contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
