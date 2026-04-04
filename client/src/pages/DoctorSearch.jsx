/**
 * ========================================
 * REQ-4: DOCTOR SEARCH AND SPECIALTY FILTER
 * Doctor listing with real-time search and filtering
 * ========================================
 * Route: /doctors
 * Access: Authenticated users
 *
 * Features:
 *  - Search by doctor name (live filter)
 *  - Filter by medical specialty (dropdown)
 *  - Display doctor ratings, experience, and availability
 *  - Select doctor to navigate to appointment booking
 *
 * Loading Strategy:
 *  - isLoading flag shows a grid of shimmer skeleton cards (800 ms) while
 *    the doctor list "loads" — mirrors how a real API response would behave.
 *
 * Empty State:
 *  - If search/filter returns no matches, a contextual empty-state block
 *    guides the user to adjust their query.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DoctorSearch.css';

export default function DoctorSearch({ onSelectDoctor }) {

  // ── Mock doctor data ─────────────────────────────────────────────────────
  // REQ-4: In production this would be fetched from a backend API.
  // Each doctor object contains all info needed for the search card.
  const [doctors] = useState([
    {
      id: 1,
      name: 'Dr. Sarah Anderson',
      specialty: 'Cardiology',
      rating: 4.8,
      reviews: 156,
      experience: '15 years',
      availability: 'Mon-Fri, 9 AM-5 PM',
      image: '👩‍⚕️',
      consultationFee: '$50',
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
      consultationFee: '$45',
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
      consultationFee: '$60',
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
      consultationFee: '$40',
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
      consultationFee: '$35',
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
      consultationFee: '$55',
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
      consultationFee: '$30',
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
      consultationFee: '$50',
    },
  ]);

  // ── REQ-4: Search and filter state ───────────────────────────────────────
  const [searchQuery, setSearchQuery]             = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');

  // ── Loading state — true while initial data is "fetching" ────────────────
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Effect: Simulate async data fetch with an 800 ms delay.
   * In production replace this with an actual API call and set
   * isLoading to false in the .finally() block.
   */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer); // cleanup to avoid state update on unmount
  }, []);

  // ── Derived: unique specialty list for the filter dropdown ───────────────
  // "All Specialties" is prepended so the user can reset the filter.
  const specialties = [
    'All Specialties',
    ...new Set(doctors.map((d) => d.specialty)),
  ];

  // ── REQ-4: Filter logic ──────────────────────────────────────────────────
  // Apply both search and specialty filter simultaneously.
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch    = doctor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'All Specialties' ||
      doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  // ── Skeleton loading card (mimics doctor card layout) ───────────────────
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

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="doctor-search-container">

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      {/* Page title and short description for context */}
      <section className="doctor-hero">
        <h1>Find Your Doctor</h1>
        <p>Search and filter by specialty to find the perfect healthcare provider</p>
      </section>

      {/* ── SEARCH AND FILTER SECTION ───────────────────────────────────── */}
      {/* REQ-4: Name search input + specialty dropdown filter */}
      <section className="search-filter-section">
        <div className="container">
          <div className="search-bar-wrapper">

            {/* REQ-4: Doctor name full-text search */}
            <div className="search-input-group">
              <input
                type="text"
                id="doctor-search-input"
                placeholder="Search by doctor name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search doctors by name"
              />
              <span className="search-icon">🔍</span>
            </div>

            {/* REQ-4: Specialty filter dropdown — derived from unique values */}
            <select
              id="specialty-filter"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="specialty-filter"
              aria-label="Filter by specialty"
            >
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic result count — hidden while loading */}
          {!isLoading && (
            <p className="results-info">
              Showing{' '}
              <strong>{filteredDoctors.length}</strong> of{' '}
              <strong>{doctors.length}</strong> doctors
            </p>
          )}
        </div>
      </section>

      {/* ── DOCTOR LIST ──────────────────────────────────────────────────── */}
      {/* REQ-4: Grid of doctor cards with ratings, specialty, availability  */}
      <section className="doctor-list-section">
        <div className="container">

          {isLoading ? (
            /* ── LOADING STATE: shimmer skeleton grid ─────────────────── */
            <div className="doctor-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonDoctorCard key={i} />
              ))}
            </div>

          ) : filteredDoctors.length > 0 ? (
            /* ── DATA LOADED: render matching doctor cards ────────────── */
            <div className="doctor-grid">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card">
                  {/* Doctor avatar emoji */}
                  <div className="doctor-avatar">{doctor.image}</div>

                  {/* Doctor metadata */}
                  <div className="doctor-info">
                    <h3 className="doctor-name">{doctor.name}</h3>

                    {/* REQ-4: Specialty badge */}
                    <span className="specialty-badge">{doctor.specialty}</span>

                    {/* REQ-4: Rating + experience */}
                    <div className="doctor-meta">
                      <div className="rating">
                        <span className="stars">⭐ {doctor.rating}</span>
                        <span className="reviews">({doctor.reviews} reviews)</span>
                      </div>
                      <p className="experience">📅 {doctor.experience} experience</p>
                    </div>

                    {/* Availability and fee */}
                    <div className="availability-info">
                      <p className="availability">🕐 {doctor.availability}</p>
                      <p className="fee">💰 Consultation: {doctor.consultationFee}</p>
                    </div>
                  </div>

                  {/* Book button — passes selected doctor via prop callback */}
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
            /* ── EMPTY STATE: search/filter returned no results ──────── */
            <div className="empty-state doctor-empty-state">
              {/* Large magnifying-glass icon for visual context */}
              <div className="empty-state-icon">🔍</div>
              <h3 className="empty-state-title">No Doctors Found</h3>
              <p className="empty-state-desc">
                {searchQuery
                  ? `No results for "${searchQuery}".`
                  : `No doctors available in "${selectedSpecialty}".`}
              </p>
              <p className="empty-state-hint">
                Try a different name or select a different specialty from the
                dropdown.
              </p>
              {/* Quick-reset: clears both search and specialty filter */}
              <button
                className="empty-state-reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('All Specialties');
                }}
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
