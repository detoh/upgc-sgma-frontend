'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Notification {
  id: string;
  titre: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  lien?: string;
  lue: boolean;
  dateCreation: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  countNonLues: number;
}

const TYPE_ICONS: Record<string, string> = {
  INFO: 'ℹ️',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '❌',
};

const TYPE_COLORS: Record<string, string> = {
  INFO: 'bg-blue-50 border-blue-200',
  SUCCESS: 'bg-green-50 border-green-200',
  WARNING: 'bg-yellow-50 border-yellow-200',
  ERROR: 'bg-red-50 border-red-200',
};

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [countNonLues, setCountNonLues] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get<NotificationsResponse>('/notifications-inapp');
      setNotifications(response.data.notifications);
      setCountNonLues(response.data.countNonLues);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  // Charger au montage et toutes les 30 secondes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Marquer une notification comme lue
  const marquerCommeLue = async (id: string, lien?: string) => {
    try {
      await api.patch(`/notifications-inapp/${id}/lue`);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, lue: true } : n)
      );
      setCountNonLues(prev => Math.max(0, prev - 1));

      // Rediriger si lien fourni
      if (lien) {
        setIsOpen(false);
        router.push(lien);
      }
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  // Marquer toutes comme lues
  const marquerToutCommeLu = async () => {
    try {
      await api.patch('/notifications-inapp/tout-lire');
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
      setCountNonLues(0);
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Badge rouge */}
        {countNonLues > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {countNonLues > 9 ? '9+' : countNonLues}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-hidden">
          {/* Header du dropdown */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Notifications {countNonLues > 0 && `(${countNonLues} non lues)`}
            </h3>
            {countNonLues > 0 && (
              <button
                onClick={marquerToutCommeLu}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="overflow-y-auto max-h-96">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto text-gray-300 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => marquerCommeLue(notification.id, notification.lien)}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.lue ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icône */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg border ${TYPE_COLORS[notification.type]} flex items-center justify-center`}>
                      <span className="text-xl">{TYPE_ICONS[notification.type]}</span>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-semibold ${!notification.lue ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.titre}
                        </p>
                        {!notification.lue && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(notification.dateCreation)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}