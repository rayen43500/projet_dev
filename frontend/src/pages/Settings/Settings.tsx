import React, { useState } from 'react';
import { Save, Shield, Bell, Monitor, Database, Globe } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: false,
      desktop: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
    },
    surveillance: {
      faceDetection: true,
      objectDetection: true,
      screenRecording: true,
      audioRecording: false,
    },
    system: {
      autoBackup: true,
      dataRetention: 365,
      language: 'fr',
    },
  });

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600">Configurez les paramètres de l'application</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Notifications par email
                  </label>
                  <p className="text-sm text-gray-500">
                    Recevoir les alertes par email
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications', 'email', !settings.notifications.email)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Notifications navigateur
                  </label>
                  <p className="text-sm text-gray-500">
                    Afficher les notifications dans le navigateur
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications', 'browser', !settings.notifications.browser)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.browser ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.browser ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Sécurité</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Authentification à deux facteurs
                  </label>
                  <p className="text-sm text-gray-500">
                    Ajouter une couche de sécurité supplémentaire
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('security', 'twoFactor', !settings.security.twoFactor)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.security.twoFactor ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.security.twoFactor ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout de session (minutes)
                </label>
                <select
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={120}>2 heures</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Surveillance */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Monitor className="h-5 w-5 text-purple-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Surveillance</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Détection faciale
                  </label>
                  <p className="text-sm text-gray-500">
                    Vérifier l'identité par reconnaissance faciale
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('surveillance', 'faceDetection', !settings.surveillance.faceDetection)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.surveillance.faceDetection ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.surveillance.faceDetection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Détection d'objets
                  </label>
                  <p className="text-sm text-gray-500">
                    Détecter les objets suspects
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('surveillance', 'objectDetection', !settings.surveillance.objectDetection)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.surveillance.objectDetection ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.surveillance.objectDetection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Enregistrement d'écran
                  </label>
                  <p className="text-sm text-gray-500">
                    Enregistrer l'activité de l'écran
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('surveillance', 'screenRecording', !settings.surveillance.screenRecording)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.surveillance.screenRecording ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.surveillance.screenRecording ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Database className="h-5 w-5 text-orange-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Système</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sauvegarde automatique
                  </label>
                  <p className="text-sm text-gray-500">
                    Sauvegarder automatiquement les données
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('system', 'autoBackup', !settings.system.autoBackup)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.system.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.system.autoBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue
                </label>
                <select
                  value={settings.system.language}
                  onChange={(e) => handleSettingChange('system', 'language', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder les paramètres
        </button>
      </div>
    </div>
  );
};

export default Settings;
