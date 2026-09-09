import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL;


function Admin_Patients({ user }) {
  const [patients, setPatients] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/users/patients`, {
      headers: {'ngrok-skip-browser-warning': 'true', 'role': 'doctor' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.patients) setPatients(data.patients)
    })
  }, [])

  return (
    <div>
      <h2>My Patients</h2>
      {patients.length === 0 ? (
        <p>No patients assigned yet.</p>
      ) : (
        <ul className="user-list">
          {patients.map((u) => (
            <li key={u.id} className="user-item">
              <span className="user-id">#{u.id}</span>
              <span className="user-name">{u.name}</span>
              <span className="user-email">{u.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Admin_Patients