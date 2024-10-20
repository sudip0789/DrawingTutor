import React from 'react';

const TutorButton = ({setUserTranscript}) => {

    const handleTutor = (e) => {
        console.log("handleTutor", e.target.value);
        setUserTranscript(e.target.value);
    }

  return (
    <button className="tutor-btn" style={styles.button} onClick={(e) => handleTutor(e)}>TutorButton</button>
  )
}

const styles = {
  button: {
    position: 'fixed',
    bottom: '20px', // Adjust the value to move it up or down
    left: '50%',
    transform: 'translateX(-50%)', // Center horizontally
    padding: '10px 20px',
    backgroundColor: '#007bff', // You can adjust the color to your preference
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  }
};

export default TutorButton;
