import React, { useState } from 'react';
import type { VacancyListing } from '../lib/supabase';
import { Phone, MessageCircle, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import './ChaletCard.css';

interface Props {
  listing: VacancyListing;
}

export function ChaletCard({ listing }: Props) {
  const [showNotes, setShowNotes] = useState(false);
  const isReserved = listing.publish_status === 'reserved';
  
  // Format phone number for URLs
  const rawPhone = listing.contact_phone.replace(/\D/g, '');
  
  // Pre-filled WhatsApp message
  const waText = encodeURIComponent(
    `السلام عليكم، رأيت إعلانكم في موقع شاغر اليوم عن ${listing.chalet_name}` +
    (listing.section_number ? ` - ${listing.section_number}` : '') +
    ` وأودّ الاستفسار عن توفّره.`
  );
  
  const callUrl = `tel:${listing.contact_phone}`;
  const waUrl = `https://wa.me/${rawPhone}?text=${waText}`;

  return (
    <div className={`chalet-card glass-panel ${isReserved ? 'reserved' : ''}`}>
      {isReserved && (
        <div className="reserved-badge">
          <span>تم الحجز</span>
        </div>
      )}
      
      <div className="card-header">
        <h3 className="text-h2 chalet-name">{listing.chalet_name}</h3>
        {listing.section_number && (
          <span className="section-badge">قسم {listing.section_number}</span>
        )}
      </div>
      
      <div className="card-location text-muted text-small">
        <MapPin size={16} />
        <span>{listing.city_name} - {listing.area_name}</span>
      </div>
      
      <div className="card-price">
        <span className="price-amount">{listing.price}</span>
        <span className="price-currency">ريال</span>
      </div>
      
      <div className="card-actions">
        {/* Buttons are disabled visually if reserved, but functionally we keep them or disable pointer events */}
        <a 
          href={isReserved ? '#' : callUrl} 
          className="action-btn btn-call"
          onClick={(e) => isReserved && e.preventDefault()}
        >
          <Phone size={18} />
          اتصال
        </a>
        <a 
          href={isReserved ? '#' : waUrl} 
          className="action-btn btn-whatsapp"
          target={isReserved ? '_self' : '_blank'}
          rel="noopener noreferrer"
          onClick={(e) => isReserved && e.preventDefault()}
        >
          <MessageCircle size={18} />
          واتساب
        </a>
        
        {listing.map_url && (
          <a 
            href={listing.map_url} 
            className="action-btn btn-map"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin size={18} />
            الخريطة
          </a>
        )}
      </div>

      {listing.notes && (
        <div className="notes-container">
          <button 
            className="notes-toggle-btn"
            onClick={() => setShowNotes(!showNotes)}
          >
            <FileText size={16} />
            ملاحظات
            {showNotes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showNotes && (
            <div className="notes-content">
              <p>{listing.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
