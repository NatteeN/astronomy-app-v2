import React, { useState, useEffect } from 'react';

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div>
      {visible && (
        <button onClick={scrollToTop} style={buttonStyle}>
          <i className="fa fa-angle-up"></i>
        </button>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  position: 'fixed',
  fontSize: '20px',
  bottom: '20px',
  right: '20px',
  padding: '10px 15px',
  backgroundColor: '#333',
  color: 'white',
  border: 'none',
  borderRadius: '100px',
  cursor: 'pointer',
  zIndex: 1000,
};

export default BackToTop;