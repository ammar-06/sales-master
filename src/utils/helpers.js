export const formatCurrency = (amount) => {
  const safeAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(safeAmount).replace('PKR', 'Rs');
};

export const getFriendlyErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/invalid-email': return "Invalid email format.";
    case 'auth/user-not-found': return "Account not found.";
    case 'auth/wrong-password': return "Incorrect password.";
    case 'auth/email-already-in-use': return "Email already used.";
    case 'auth/weak-password': return "Password too short.";
    default: return "Connection error. Please retry.";
  }
};

export const chunkArray = (array, size) => {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};

export const handleNumberInput = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
  }
};

// Sounds removed — playSound is kept as a no-op to avoid import errors
export const playSound = () => {};