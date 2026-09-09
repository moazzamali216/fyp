function Profile({ user }) {
  const getRoleIcon = (role) => {
    const icons = {
      patient: '👤',
      doctor: '👨‍⚕️',
      admin: '🛡️'
    }
    return icons[role] || '👤'
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div>
      {/* Profile Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '24px',
        padding: '24px',
        background: '#113d13',
        borderRadius: '12px',
        marginBottom: '24px',
        color: 'white'
      }}>
        {/* Avatar */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          {getInitials(user.name)}
        </div>

        {/* User Info */}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>
            {user.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{getRoleIcon(user.role)}</span>
            <span style={{ 
              textTransform: 'capitalize',
              fontWeight: '500'
            }}>
              {user.role}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
            {user.email}
          </p>
        </div>
      </div>



      {/* Profile Details */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #E8EAF6',
        padding: '24px'
      }}>
        <h3 style={{ margin: '0 0 6px 0' }}>Personal Information</h3>
        <p style={{ color: '#757575', margin: '0 0 20px 0', fontSize: '14px' }}>
          Your account details
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {/* ID */}
          <div>
            <div style={{ fontSize: '13px', color: '#757575', fontWeight: '600' }}>
              🆔 User ID
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
              #{user.id}
            </div>
          </div>

          {/* Name */}
          <div>
            <div style={{ fontSize: '13px', color: '#757575', fontWeight: '600' }}>
              👤 Full Name
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
              {user.name}
            </div>
          </div>

          {/* Email */}
          <div>
            <div style={{ fontSize: '13px', color: '#757575', fontWeight: '600' }}>
              📧 Email
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
              {user.email}
            </div>
          </div>

          {/* Role */}
          <div>
            <div style={{ fontSize: '13px', color: '#757575', fontWeight: '600' }}>
              🎯 Role
            </div>
            <div style={{ marginTop: '4px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '20px',
                background: user.role === 'admin' ? '#7B1FA2' : 
                          user.role === 'doctor' ? '#283593' : '#43A047',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {getRoleIcon(user.role)} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>

          {/* Phone */}
          <div>
            <div style={{ fontSize: '13px', color: '#757575', fontWeight: '600' }}>
              📱 Phone
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
              +92 300 1234567
            </div>
          </div>

          {/* Joined */}
          <div>
            <div style={{ fontSize: '13px', color: '#757575', fontWeight: '600' }}>
              📅 Joined
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #E8EAF6',
        padding: '24px',
        marginTop: '24px'
      }}>
        <h3 style={{ margin: '0 0 6px 0' }}>Recent Activity</h3>
        <p style={{ color: '#757575', margin: '0 0 20px 0', fontSize: '14px' }}>
          Your latest predictions
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E8EAF6'
          }}>
            <div style={{ fontSize: '20px' }}>✅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500' }}>Low Risk Prediction</div>
              <div style={{ fontSize: '13px', color: '#757575' }}>Glucose: 95 mg/dL</div>
            </div>
            <div style={{ fontSize: '12px', color: '#BDBDBD' }}>2 hours ago</div>
            <span style={{
              padding: '2px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#E8F5E9',
              color: '#43A047'
            }}>
              Low
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E8EAF6'
          }}>
            <div style={{ fontSize: '20px' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500' }}>Medium Risk Prediction</div>
              <div style={{ fontSize: '13px', color: '#757575' }}>BMI: 29.8 kg/m²</div>
            </div>
            <div style={{ fontSize: '12px', color: '#BDBDBD' }}>2 days ago</div>
            <span style={{
              padding: '2px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#FFF3E0',
              color: '#FB8C00'
            }}>
              Medium
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E8EAF6'
          }}>
            <div style={{ fontSize: '20px' }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500' }}>Health Report Downloaded</div>
              <div style={{ fontSize: '13px', color: '#757575' }}>Monthly summary PDF</div>
            </div>
            <div style={{ fontSize: '12px', color: '#BDBDBD' }}>5 days ago</div>
            <span style={{
              padding: '2px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#E8EAF6',
              color: '#283593'
            }}>
              Completed
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile