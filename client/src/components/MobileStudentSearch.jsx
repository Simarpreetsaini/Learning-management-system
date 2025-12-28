import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Clock, 
  User,
  Mic,
  MicOff
} from 'lucide-react';

const MobileStudentSearch = ({ 
  searchQuery, 
  onSearchChange, 
  onSearch, 
  onClear,
  placeholder = "Search students...",
  recentSearches = [],
  onRecentSearchClick,
  suggestions = []
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onSearchChange]);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    onSearchChange(value);
    setShowSuggestions(value.length > 0 && (suggestions.length > 0 || recentSearches.length > 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (suggestion) => {
    onSearchChange(suggestion);
    onSearch();
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onClear();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const filteredRecentSearches = recentSearches.filter(search =>
    search.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  return (
    <div className="relative">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative flex items-center bg-white rounded-xl border-2 transition-all duration-200 ${
          isFocused ? 'border-blue-500 shadow-lg' : 'border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center pl-4 pr-2 gap-2">
            <Search className={`h-5 w-5 transition-colors ${
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`} />
            
            {/* Voice Search Button - Moved to left side */}
            {recognitionRef.current && (
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-1.5 rounded-lg transition-all ${
                  isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
                aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(searchQuery.length > 0 && (suggestions.length > 0 || recentSearches.length > 0));
            }}
            onBlur={() => {
              setIsFocused(false);
              // Delay hiding suggestions to allow clicks
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder={placeholder}
            className="flex-1 py-3 px-2 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
          />

          <div className="flex items-center gap-1 pr-2">
            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Search Button */}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Voice Search Indicator */}
        {isListening && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Listening... Speak now</span>
            </div>
          </div>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (isFocused || searchQuery) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Recent Searches */}
          {filteredRecentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent</span>
              </div>
              {filteredRecentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suggestions</span>
              </div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchQuery && filteredSuggestions.length === 0 && filteredRecentSearches.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No suggestions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileStudentSearch;
