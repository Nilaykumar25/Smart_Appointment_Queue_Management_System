/**
 * REQ-4: DOCTOR SEARCH AND SPECIALTY FILTER
 * Fetches real doctors from backend API
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../services/auth';
import '../styles/DoctorSearch.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DoctorSearch({ onSelectDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => { setDoctors(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const specialties = useMemo(() => [
    'All Specialties',
    ...new Set(doctors.map(d => d.specialty)),
  ], [doctors]);

  const filteredDoctors = useMemo(() => doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || d.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  }), [doctors, searchQuery, selectedSpecialty]);

  const SkeletonDoctorCard = () => (
    <div className="doctor-card skeleton-card" aria-hidden="true">
      <div className="skeleton-avatar skeleton-shimmer"></div>
      <div className="skeleton-info">
        <div className="skeleton-line skeleton-shimmer skeleton-title"></div>
        <div className="skeleton-line skeleton-shimmer skeleton-text"></div>
        <div className="skeleton-line skeleton-shimmer skeleton-text short"></div>
      </div>
    </div>
  );

  return (
    <div className="doctor-search-container">
      <section className="doctor-hero">
        <h1>Find Your Doctor</h1>
        <p>Search and filter by specialty to find the perfect healthcare provider</p>
      </section>

      <section className="search-filter-section">
        <div className="container">
          <div className="search-bar-wrapper">
            <div className="search-input-group">
              <input
                type="text"
                id="doctor-search-input"
                placeholder="Search by doctor name…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search doctors by name"
              />
              <span className="search-icon">🔍</span>
            </div>
            <select
              id="specialty-filter"
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className="specialty-filter"
              aria-label="Filter by specialty"
            >
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {!isLoading && (
            <p className="results-info">
              Showing <strong>{filteredDoctors.length}</strong> of <strong>{doctors.length}</strong> doctors
            </p>
          )}
        </div>
      </section>

      <section className="doctor-list-section">
        <div className="container">
          {isLoading ? (
            <div className="doctor-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonDoctorCard key={i} />)}
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="doctor-grid">
              {filteredDoctors.map(doctor => (
                <div key={doctor.doctor_id} className="doctor-card">
                  <div className="doctor-avatar">👨‍⚕️</div>
                  <div className="doctor-info">
                    <h3 className="doctor-name">{doctor.name}</h3>
                    <span className="specialty-badge">{doctor.specialty}</span>
                  </div>
                  <Link
                    to={`/book-appointment/${doctor.doctor_id}`}
                    className="book-btn"
                    onClick={() => onSelectDoctor && onSelectDoctor(doctor)}
                  >
                    Book Appointment
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state doctor-empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3 className="empty-state-title">No Doctors Found</h3>
              <p className="empty-state-desc">
                {searchQuery ? `No results for "${searchQuery}".` : `No doctors in "${selectedSpecialty}".`}
              </p>
              <button
                className="empty-state-reset-btn"
                onClick={() => { setSearchQuery(''); setSelectedSpecialty('All Specialties'); }}
              >
                ✕ Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
