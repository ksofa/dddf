export const isAuthenticated = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      return false;
    }
    
    const decoded = jwtDecode(token);
    const isValid = decoded && decoded.exp * 1000 > Date.now();
    console.log('Token validation:', { 
      hasToken: !!token,
      decoded: decoded ? {
        exp: decoded.exp,
        currentTime: Date.now(),
        isValid
      } : null
    });
    return isValid;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}; 