/**
 * ========================================
 * REQ-4: DOCTOR SEARCH AND SPECIALTY FILTER
 * Doctor Listing with Search and Filtering
 * ========================================
 * Features:
 * - Search by doctor name
 * - Filter by medical specialty
 * - Display doctor ratings and availability
 * - Select doctor for appointment booking
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DoctorSearch.css';

export default function DoctorSearch({ onSelectDoctor }) {
  // REQ-4: Doctor data with specialties and ratings
  const [doctors] = useState([
    {
      id: 1,
      name: 'Dr. Sarah Anderson',
      specialty: 'Cardiology',
      rating: 4.8,
      reviews: 156,
      experience: '15 years',
      availability: 'Mon-Fri, 9 AM-5 PM',
      image: '👨‍⚕️',
      consultationFee: '$50'
    },
    {
      id: 2,
      name: 'Dr. James Mitchell',
      specialty: 'Orthopedics',
      rating: 4.7,
      reviews: 142,
      experience: '12 years',
      availability: 'Tue-Sat, 10 AM-6 PM',
      image: '👨‍⚕️',
      consultationFee: '$45'
    },
    {
      id: 3,
      name: 'Dr. Emily Watson',
      specialty: 'Neurology',
      rating: 4.9,
      reviews: 189,
      experience: '18 years',
      availability: 'Mon-Thu, 8 AM-4 PM',
      image: '👩‍⚕️',
      consultationFee: '$60'
    },
    {
      id: 4,
      name: 'Dr. Michael Johnson',
      specialty: 'Dermatology',
      rating: 4.6,
      reviews: 128,
      experience: '10 years',
      availability: 'Wed-Sun, 11 AM-7 PM',
      image: '👨‍⚕️',
      consultationFee: '$40'
    },
    {
      id: 5,
      name: 'Dr. Lisa Chen',
      specialty: 'Pediatrics',
      rating: 4.9,
      reviews: 201,
      experience: '14 years',
      availability: 'Mon-Fri, 9 AM-5 PM',
      image: '👩‍⚕️',
      consultationFee: '$35'
    },
    {
      id: 6,
      name: 'Dr. Robert Williams',
      specialty: 'Ophthalmology',
      rating: 4.7,
      reviews: 134,
      experience: '16 years',
      availability: 'Tue-Sat, 10 AM-6 PM',
      image: '👨‍⚕️',
      consultationFee: '$55'
    },
    {
      id: 7,
      name: 'Dr. Amanda Foster',
      specialty: 'General Practice',
      rating: 4.8,
      reviews: 267,
      experience: '11 years',
      availability: 'Mon-Sun, 8 AM-8 PM',
      image: '👩‍⚕️',
      consultationFee: '$30'
    },
    {
      id: 8,
      name: 'Dr. David Kumar',
      specialty: 'Psychiatry',
      rating: 4.6,
      reviews: 98,
      experience: '13 years',
      availability: 'Mon-Fri, 2 PM-8 PM',
      image: '👨‍⚕️',
      consultationFee: '$50'
    }
  ]);

  // REQ-4: Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');

  // Extract unique specialties for filter dropdown
  const specialties = ['All Specialties', ...new Set(doctors.map(d => d.specialty))];

  // REQ-4: Filter and search logic
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="doctor-search-container">
      {/* Hero Section */}
      <section className="doctor-hero">
        <h1>Find Your Doctor</h1>
        <p>Search and filter by specialty to find the perfect healthcare provider</p>
      </section>

      {/* REQ-4: Search and Filter Section */}
      <section className="search-filter-section">
        <div className="container">
          <div className="search-bar-wrapper">
            {/* REQ-4: Doctor Name Search */}
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search by doctor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            {/* REQ-4: Specialty Filter Dropdown */}
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="specialty-filter"
            >
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Search Results Count */}
          <p className="results-info">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </p>
        </div>
      </section>

      {/* REQ-4: Doctor List with Specialty and Ratings */}
      <section className="doctor-list-section">
        <div className="container">
          {filteredDoctors.length > 0 ? (
            <div className="doctor-grid">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card">
                  {/* Doctor Avatar */}
                  <div className="doctor-avatar">{doctor.image}</div>

                  {/* Doctor Info */}
                  <div className="doctor-info">
                    <h3 className="doctor-name">{doctor.name}</h3>
                    
                    {/* REQ-4: Specialty Badge */}
                    <span className="specialty-badge">{doctor.specialty}</span>

                    {/* REQ-4: Ratings and Experience */}
                    <div className="doctor-meta">
                      <div className="rating">
                        <span className="stars">⭐ {doctor.rating}</span>
                        <span className="reviews">({doctor.reviews} reviews)</span>
                      </div>
                      <p className="experience">📅 {doctor.experience} experience</p>
                    </div>

                    {/* Availability Info */}
                    <div className="availability-info">
                      <p className="availability">🕐 {doctor.availability}</p>
                      <p className="fee">💰 Consultation: {doctor.consultationFee}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/book-appointment/${doctor.id}`}
                    className="book-btn"
                    onClick={() => onSelectDoctor && onSelectDoctor(doctor)}
                  >
                    Book Appointment
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No doctors found</h3>
              <p>Try adjusting your search or specialty filter</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
