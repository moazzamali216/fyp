import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;

function Data_Train(){
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '2rem 3rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        textAlign: 'center',
        maxWidth: '500px',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.25rem',
          color: '#333',
          fontWeight: 500,
        }}>
          This Feature will be available after upgrading server RAM
        </h1>
      </div>
    </div>
  );
}

export default Data_Train