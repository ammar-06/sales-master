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

export const playSound = (type) => {
  const soundUrls = {
    pop: 'https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3',
    success: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
    error: 'https://assets.mixkit.co/sfx/preview/mixkit-simple-game-countdown-921.mp3',
    delete: 'https://assets.mixkit.co/sfx/preview/mixkit-interface-option-select-2573.mp3'
  };
  try {
    const audio = new Audio(soundUrls[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {}
};