import { FaWhatsapp } from "react-icons/fa";
import { SiGooglemaps } from "react-icons/si";

interface WhatsAppButtonProps {
  phoneNumber?: string | null;
  className?: string;
}

interface GoogleMapsButtonProps {
  coordinate?: string | null;
  className?: string;
}

export function WhatsAppButton({ phoneNumber, className = "" }: WhatsAppButtonProps) {
  if (!phoneNumber) return null;

  // Remove any non-numeric characters for WhatsApp
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Format WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 ${className}`}
      title="Chat WhatsApp"
    >
      <FaWhatsapp className="text-white text-base" />
    </a>
  );
}

export function GoogleMapsButton({ coordinate, className = "" }: GoogleMapsButtonProps) {
  if (!coordinate) return null;

  // Format Google Maps URL with coordinate
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinate)}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 ${className}`}
      title="Buka di Google Maps"
    >
      <SiGooglemaps className="text-white text-base" />
    </a>
  );
}