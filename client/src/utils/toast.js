// No-operation toast system - all toast calls will be silently ignored
// This effectively disables all toast notifications throughout the application

// Create a no-op function that does nothing
const noOp = () => {};

// Create toast object with all the same methods but they do nothing
const toast = {
  success: noOp,
  error: noOp,
  warning: noOp,
  info: noOp,
  dismiss: noOp,
  isActive: () => false,
  update: noOp,
  done: noOp,
  onChange: noOp,
  configure: noOp,
  // Mock constants to prevent errors
  POSITION: {
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    TOP_CENTER: 'top-center',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_CENTER: 'bottom-center'
  },
  TYPE: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    DEFAULT: 'default'
  }
};

// Export the same interface as before but with no-op functions
export { toast };
export const showToast = toast;
export default toast;
