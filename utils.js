// utils.js
export function getErrorMessage(error) {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-not-found':
      return 'No user found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    default:
      return error.message;
  }
}
