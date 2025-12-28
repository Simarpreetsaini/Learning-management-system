import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FileText, IndianRupee, ArrowLeft, Clock, Download, User, AlertCircle } from 'lucide-react';
import { paidNotesApi, formatPrice, formatDate } from '../api/paidNotesApi';
import PaymentForm from '../components/paid-notes/PaymentForm';
import SmartHeader from '../components/SmartHeader';
import { toast } from '../utils/toast';

// Get Stripe publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe only if the key is available
let stripePromise = null;
if (stripePublishableKey) {
  stripePromise = loadStripe(stripePublishableKey);
} else {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

const PaidNoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchNoteDetails();
  }, [id]);

  const fetchNoteDetails = async () => {
    try {
      setLoading(true);
      const response = await paidNotesApi.getNoteById(id);
      setNote(response.data);
    } catch (error) {
      toast.error('Failed to fetch note details');
      console.error('Error fetching note details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSuccess = async (orderData) => {
    setPurchaseSuccess(true);
    setShowPaymentForm(false);
    setDownloadInfo(orderData);
    toast.success('Purchase successful! You can now download your note.');
  };

  const handlePurchaseError = (error) => {
    toast.error(error || 'Payment failed. Please try again.');
  };

  const handleDownload = async () => {
    if (!downloadInfo || !downloadInfo.downloadUrl) {
      toast.error('Download information is missing. Please try again.');
      return;
    }

    if (downloadInfo.isExpired) {
      toast.error('Download link has expired. Please contact support.');
      return;
    }

    try {
      setIsDownloading(true);
      
      // Extract orderId and accessKey from downloadUrl
      const urlParts = downloadInfo.downloadUrl.split('/');
      const orderId = urlParts[urlParts.length - 2];
      const accessKey = urlParts[urlParts.length - 1];
      
      // Call the download endpoint to get the signed AWS URL
      const downloadUrl = paidNotesApi.downloadNote(orderId, accessKey);
      const response = await fetch(downloadUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.downloadUrl) {
          // Open the signed AWS URL directly
          window.open(data.data.downloadUrl, '_blank');
          toast.success('Download started successfully!');
        } else {
          toast.error(data.error || 'Failed to get download link.');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <SmartHeader />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <SmartHeader />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Note not found</h2>
          <p className="mt-2 text-gray-600">The note you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/paid-notes')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Notes
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <SmartHeader />
      <div className="max-w-4xl mx-auto container-padding py-4 sm:py-6 lg:py-8">
        {/* Mobile-Optimized Back Button */}
        <button
          onClick={() => navigate('/paid-notes')}
          className="mb-4 sm:mb-6 btn-mobile inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          <span className="text-sm sm:text-base">Back to Notes</span>
        </button>

        {/* Mobile-Optimized Note Details */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            {/* Header Section - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {note.title}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{note.subject?.name || 'Subject not specified'}</p>
              </div>
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 self-start">
                {note.category}
              </span>
            </div>

            {/* Description Section */}
            <div className="mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {note.description}
              </p>
            </div>

            {/* Meta Information - Mobile Optimized */}
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base truncate">By {note.uploadedBy?.fullname || 'Expert Teacher'}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Uploaded {formatDate(note.uploadDate)}</span>
              </div>
            </div>

            {/* Purchase Section - Mobile Optimized */}
            <div className="mt-6 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
              {/* Price Display */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Digital Note</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 mr-1" />
                  {formatPrice(note.price)}
                </div>
              </div>

              {/* Purchase States */}
              {purchaseSuccess ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="text-green-800 dark:text-green-200 font-medium mb-2 text-sm sm:text-base">Purchase Successful!</h3>
                  <p className="text-green-700 dark:text-green-300 text-xs sm:text-sm mb-4">
                    Your payment has been processed successfully. Click the button below to download your note.
                  </p>
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full btn-mobile inline-flex justify-center items-center px-4 sm:px-6 py-2.5 sm:py-3 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Download Note
                      </>
                    )}
                  </button>
                </div>
              ) : !stripePublishableKey ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                    <h3 className="text-red-800 dark:text-red-200 font-medium text-sm sm:text-base">Payment System Not Available</h3>
                  </div>
                  <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm mb-4">
                    The payment system is currently not configured. Please contact the administrator to enable payments.
                  </p>
                  <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded p-3">
                    <p className="text-red-800 dark:text-red-200 text-xs">
                      <strong>For Administrators:</strong> Please set the VITE_STRIPE_PUBLISHABLE_KEY environment variable in your .env file.
                    </p>
                  </div>
                </div>
              ) : showPaymentForm ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      amount={note.price}
                      noteId={note._id}
                      onSuccess={handlePurchaseSuccess}
                      onError={handlePurchaseError}
                    />
                  </Elements>
                </div>
              ) : (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full btn-mobile inline-flex justify-center items-center px-4 sm:px-6 py-2.5 sm:py-3 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Purchase Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaidNoteDetails;
