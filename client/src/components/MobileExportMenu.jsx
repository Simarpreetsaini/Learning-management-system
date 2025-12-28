import React, { useState } from 'react';
import { 
  Download, 
  X, 
  FileText, 
  FileSpreadsheet, 
  Users, 
  Filter,
  CheckSquare
} from 'lucide-react';

const MobileExportMenu = ({ 
  isOpen, 
  onClose, 
  selectedCount = 0,
  onExportAll,
  onExportFiltered,
  onExportSelected,
  hasFilters = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState('excel');

  if (!isOpen) return null;

  const exportOptions = [
    {
      id: 'all',
      title: 'Export All Students',
      description: 'Download complete student database',
      icon: Users,
      color: 'blue',
      action: () => onExportAll(selectedFormat)
    },
    ...(hasFilters ? [{
      id: 'filtered',
      title: 'Export Filtered Results',
      description: 'Download students matching current filters',
      icon: Filter,
      color: 'green',
      action: () => onExportFiltered(selectedFormat)
    }] : []),
    ...(selectedCount > 0 ? [{
      id: 'selected',
      title: `Export Selected (${selectedCount})`,
      description: `Download ${selectedCount} selected students`,
      icon: CheckSquare,
      color: 'purple',
      action: () => onExportSelected(selectedFormat)
    }] : [])
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Export Menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Export Students</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Format Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Format</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedFormat('excel')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedFormat === 'excel'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className={`h-5 w-5 ${
                    selectedFormat === 'excel' ? 'text-green-600' : 'text-gray-500'
                  }`} />
                  <div className="text-left">
                    <div className={`text-sm font-medium ${
                      selectedFormat === 'excel' ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      Excel
                    </div>
                    <div className="text-xs text-gray-500">.xlsx</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedFormat('pdf')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`h-5 w-5 ${
                    selectedFormat === 'pdf' ? 'text-red-600' : 'text-gray-500'
                  }`} />
                  <div className="text-left">
                    <div className={`text-sm font-medium ${
                      selectedFormat === 'pdf' ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      PDF
                    </div>
                    <div className="text-xs text-gray-500">.pdf</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Export Options</h4>
            {exportOptions.map((option) => {
              const IconComponent = option.icon;
              const colorClasses = {
                blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
                purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              };

              return (
                <button
                  key={option.id}
                  onClick={() => {
                    option.action();
                    onClose();
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${colorClasses[option.color]}`}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{option.title}</div>
                      <div className="text-xs opacity-75 mt-1">{option.description}</div>
                    </div>
                    <Download className="h-4 w-4 opacity-50" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Note */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-xs text-blue-700">
                <div className="font-medium mb-1">Export Information</div>
                <div>Files will be downloaded to your device. Large exports may take a few moments to process.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileExportMenu;
