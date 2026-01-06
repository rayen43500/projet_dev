import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, Users, Search } from 'lucide-react';
import { apiService } from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Student {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

const CreateExamModal: React.FC<CreateExamModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    start_time: '',
    end_time: '',
    allowed_apps: '',
    allowed_domains: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await apiService.get<Student[]>(API_ENDPOINTS.USERS.STUDENTS);
      if (response.data) {
        setStudents(response.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const parseJsonField = (value: string, fieldName: string): any[] => {
    if (!value || value.trim() === '') {
      return [];
    }
    
    try {
      // Essayer de parser directement comme JSON
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error(`Le champ ${fieldName} doit être un tableau JSON`);
    } catch (error) {
      // Si le parsing JSON échoue, essayer de convertir depuis un format simple
      // Support pour: "app1, app2, app3" ou "app1,app2,app3"
      const trimmed = value.trim();
      
      // Si ça commence par [ mais n'est pas du JSON valide, essayer de nettoyer
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const content = trimmed.slice(1, -1).trim();
        if (content) {
          // Extraire les éléments entre guillemets ou séparés par des virgules
          const items = content.split(',').map(item => {
            const cleaned = item.trim().replace(/^["']|["']$/g, '');
            return cleaned;
          }).filter(item => item.length > 0);
          return items;
        }
        return [];
      }
      
      // Si c'est juste une liste séparée par des virgules
      const items = trimmed.split(',').map(item => item.trim()).filter(item => item.length > 0);
      if (items.length > 0) {
        return items;
      }
      
      throw new Error(`Format invalide pour ${fieldName}. Utilisez JSON: ["item1", "item2"] ou une liste séparée par des virgules`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Valider et parser les champs JSON
      let allowedApps: string[] = [];
      let allowedDomains: string[] = [];
      
      try {
        allowedApps = parseJsonField(formData.allowed_apps, 'applications autorisées');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Format invalide pour les applications autorisées');
        setIsLoading(false);
        return;
      }
      
      try {
        allowedDomains = parseJsonField(formData.allowed_domains, 'domaines autorisés');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Format invalide pour les domaines autorisés');
        setIsLoading(false);
        return;
      }

      // Convertir les dates en format ISO
      const examData = {
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes.toString()),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        allowed_apps: allowedApps,
        allowed_domains: allowedDomains,
        student_ids: selectedStudentIds.length > 0 ? selectedStudentIds : undefined,
      };

      const response = await apiService.post(API_ENDPOINTS.EXAMS.CREATE, examData);

      if (response.data) {
        // Réinitialiser le formulaire
        setFormData({
          title: '',
          description: '',
          duration_minutes: 60,
          start_time: '',
          end_time: '',
          allowed_apps: '',
          allowed_domains: '',
        });
        setSelectedStudentIds([]);
        setSearchTerm('');
        onSuccess?.();
        onClose();
      } else {
        setError(response.error || 'Erreur lors de la création de l\'examen');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la création de l\'examen');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Créer un nouvel examen</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Titre de l'examen *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Examen de Programmation Java"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Description de l'examen..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">
                      Durée (minutes) *
                    </label>
                    <input
                      type="number"
                      id="duration_minutes"
                      name="duration_minutes"
                      required
                      min="1"
                      value={formData.duration_minutes}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                      Date et heure de début *
                    </label>
                    <input
                      type="datetime-local"
                      id="start_time"
                      name="start_time"
                      required
                      value={formData.start_time}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                      Date et heure de fin *
                    </label>
                    <input
                      type="datetime-local"
                      id="end_time"
                      name="end_time"
                      required
                      value={formData.end_time}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="allowed_apps" className="block text-sm font-medium text-gray-700">
                    Applications autorisées (JSON)
                  </label>
                  <input
                    type="text"
                    id="allowed_apps"
                    name="allowed_apps"
                    value={formData.allowed_apps}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder='["chrome", "firefox"]'
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format JSON: ["app1", "app2"]
                  </p>
                </div>

                <div>
                  <label htmlFor="allowed_domains" className="block text-sm font-medium text-gray-700">
                    Domaines autorisés (JSON)
                  </label>
                  <input
                    type="text"
                    id="allowed_domains"
                    name="allowed_domains"
                    value={formData.allowed_domains}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder='["example.com", "docs.example.com"]'
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format JSON: ["domain1.com", "domain2.com"]
                  </p>
                </div>

                {/* Sélection des étudiants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Étudiants assignés
                  </label>
                  
                  {/* Barre de recherche */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un étudiant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Liste des étudiants */}
                  <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                    {loadingStudents ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Chargement des étudiants...
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Aucun étudiant trouvé
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                          <label
                            key={student.id}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {student.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {student.email} • {student.username}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedStudentIds.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      {selectedStudentIds.length} étudiant(s) sélectionné(s)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Création...' : 'Créer l\'examen'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateExamModal;

