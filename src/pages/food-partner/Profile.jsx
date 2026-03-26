import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE = 'http://localhost:3000/api'

const Profile = () => {
  const { id } = useParams()
  const [businessData, setBusinessData] = useState({
    businessName: 'Business name',
    address: 'Address',
    totalMeals: 43,
    customersServed: '15K',
    profilePhoto: null
  })
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [currentPartner, setCurrentPartner] = useState(null)
  const [resolvedPartnerId, setResolvedPartnerId] = useState(null)

  const handleLogout = async () => {
    try {
      await axios.get(`${API_BASE}/auth/food-partner/logout`, { withCredentials: true });
      Cookies.remove('token');
      navigate('/food-partner/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still remove cookie and navigate
      Cookies.remove('token');
      navigate('/food-partner/login');
    }
  };

  useEffect(() => {
    console.log('Profile id:', id);
    const resolveAndFetch = async () => {
      setLoading(true);
      try {
        // Resolve partner id: URL param first, then /me (must not block on /me failing)
        let mePartner = null;
        try {
          const meRes = await axios.get(`${API_BASE}/auth/food-partner/me`, { withCredentials: true });
          mePartner = meRes?.data?.foodPartner ?? null;
        } catch (meErr) {
          console.warn('food-partner/me:', meErr?.response?.status || meErr.message);
        }
        setCurrentPartner(mePartner);

        const partnerId = id || mePartner?._id;
        setResolvedPartnerId(partnerId || null);

        if (!partnerId) {
          setVideos([]);
          return;
        }

        const [partnerRes, foodRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/auth/food-partner/${partnerId}`, { withCredentials: true }),
          axios.get(`${API_BASE}/food/partner/${partnerId}`, { withCredentials: true })
        ]);

        if (partnerRes.status === 'fulfilled' && partnerRes.value?.data) {
          const p = partnerRes.value.data;
          setBusinessData({
            businessName: p.name || 'Business name',
            address: p.address || 'Address',
            totalMeals: 43,
            customersServed: '15K',
            profilePhoto: p.profilePhoto || null
          });
        }

        if (foodRes.status === 'fulfilled') {
          setVideos(foodRes.value.data.foodItems || []);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setVideos([]);
        setCurrentPartner(null);
        setResolvedPartnerId(null);
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [id])

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-header-top">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-circle">
              {businessData.profilePhoto ? (
                <img src={businessData.profilePhoto} alt="Profile" className="profile-avatar-image" />
              ) : (
                <div className="profile-avatar-placeholder">📷</div>
              )}
            </div>
            <button
            onClick={handleLogout}
            className="back-button profile-back-button"
            title="Logout"
          >
            Logout
          </button>
          </div>

          <div className="profile-info-container">
            <div className="profile-info-field">{businessData.businessName}</div>
            <div className="profile-info-field">{businessData.address}</div>
          </div>
        </div>

        <div className="profile-stats-container">
          <div className="profile-stat">
            <div className="profile-stat-label">total meals</div>

            <div className="profile-stat-number">{businessData.totalMeals}</div>
          </div>
          <button
            onClick={() => {
              const pid = id || resolvedPartnerId;
              navigate('/create-food', {
                state: { returnTo: pid ? `/profile/${pid}` : '/profile' }
              });
            }}
            className="profile-upload-reel-btn-bottom"
            title="Upload a reel"
          >
            <i className="fa-solid fa-upload"></i>
          </button>
          <div className="profile-stat">
            <div className="profile-stat-label">customer serve</div>
            <div className="profile-stat-number">{businessData.customersServed}</div>
          </div>
        </div>
      </div>

      <div className="profile-videos-container">
        <div className="profile-videos-grid">
          {loading ? (
            Array(6).fill(null).map((_, i) => (
              <div key={i} className="profile-video-item">
                <div className="profile-video-placeholder">Loading...</div>
              </div>
            ))
          ) : videos.length > 0 ? (
            videos.map((video) => (
              <div key={video._id} className="profile-video-item">
                <video
                  src={video.video}
                  className="profile-video-element"
                  muted
                  playsInline
                  controls
                  loop
                />
              </div>
            ))
          ) : (
            <div className="profile-no-videos">No videos uploaded yet</div>
          )}
        </div>
      </div>


    </div>
  )
}

export default Profile