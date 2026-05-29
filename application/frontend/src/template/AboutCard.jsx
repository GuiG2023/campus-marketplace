// src/AboutCard.jsx
import React from 'react';

// For Bart: import this component into your App.jsx
// file using 'import AboutCard from './AboutCard''

// The variables in the { } are the "props" that can be changed for each person
function AboutCard({ name, imageSrc, role, bio }) {
    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', margin: '10px', borderRadius: '8px', maxWidth: '300px' }}>
            <img
                src={imageSrc}
                alt={`Profile picture of ${name}`}
                style={{ width: '100%', borderRadius: '8px' }}
            />
            <h2>{name}</h2>
            <h3>{role}</h3>
            <p>{bio}</p>
        </div>
    );
}

export default AboutCard;