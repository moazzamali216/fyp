import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Data_Table from "./views/Data_Table"
import Data_Process from "./views/Data_Process"
import Data_Visualization from './views/Data_Visualization'
import Data_Prepare from './views/Data_Prepare'


function Data_Dashboard() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [view, setView] = useState(true)
    const [activeTab, setActiveTab] = useState('data')

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (!userData) {
            navigate('/login')
        } else {
            setUser(JSON.parse(userData))
        }
    }, [navigate])







    if (!user) return (
        <div className="flex-center" style={{ minHeight: '100vh' }}>
            <div className="spinner"></div>
        </div>
    )

    return (
        <div className="dashboard-container">



            <div className="dashboard-layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <button
                        className={`sidebar-btn ${activeTab === 'data' ? 'active' : ''}`}
                        onClick={() => setActiveTab('data')}
                    >
                        <span className="icon">📊</span> Training Data
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'preprocess-data' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preprocess-data')}
                    >
                        <span className="icon">⧝</span> Clean Data
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'eda' ? 'active' : ''}`}
                        onClick={() => setActiveTab('eda')}
                    >
                        <span className="icon">🧑🏻‍💻</span> EDA & Visualization
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'pre' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pre')}
                    >
                        <span className="icon">♾</span> Data Prepare to feed model
                    </button>
                    <button
                        className={'sidebar-btn '} onClick={() => navigate('/admin-dashboard', { replace: "True" })}
                    >
                        <span className="icon">🔙</span> Return Dashboard
                    </button>



                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {activeTab === "data" && <Data_Table />}
                    {activeTab === "preprocess-data" && <Data_Process />}
                    {activeTab === "eda" && <Data_Visualization />}
                    {activeTab === "pre" && <Data_Prepare />}



                </main>
            </div>
        </div>
    )
}

export default Data_Dashboard