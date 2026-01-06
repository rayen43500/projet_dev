import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import CreateExamModal from '../../components/Exams/CreateExamModal';
import { apiService } from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

interface Exam {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

interface ExamDisplay {
  id: number;
  title: string;
  description: string;
  duration: number;
  status: string;
  students: number;
  startDate: string;
  endDate: string;
}

const Exams: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exams, setExams] = useState<ExamDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.get<Exam[]>(API_ENDPOINTS.EXAMS.LIST);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        // Mapper les données de l'API vers le format d'affichage
        const mappedExams: ExamDisplay[] = response.data.map((exam) => {
          // Déterminer le statut basé sur is_active et les dates
          let status = 'draft';
          if (exam.is_active) {
            const now = new Date();
            const startTime = new Date(exam.start_time);
            const endTime = new Date(exam.end_time);
            
            if (now >= startTime && now <= endTime) {
              status = 'active';
            } else if (now < startTime) {
              status = 'scheduled';
            } else {
              status = 'active'; // On garde active même si c'est passé
            }
          }

          // Formater les dates pour l'affichage
          const startDate = new Date(exam.start_time).toLocaleDateString('fr-FR');
          const endDate = new Date(exam.end_time).toLocaleDateString('fr-FR');

          return {
            id: exam.id,
            title: exam.title,
            description: exam.description || '',
            duration: exam.duration_minutes,
            status,
            students: 0, // TODO: Récupérer le nombre d'étudiants assignés
            startDate,
            endDate,
          };
        });

        setExams(mappedExams);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des examens');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'scheduled':
        return 'Programmé';
      case 'draft':
        return 'Brouillon';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Examens</h1>
          <p className="text-gray-600">Créez et gérez vos examens</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Examen
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Exams Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Chargement des examens...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun examen trouvé. Créez votre premier examen !</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Examen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Étudiants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {exam.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {exam.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exam.duration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exam.students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exam.startDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          exam.status
                        )}`}
                      >
                        {getStatusText(exam.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Rafraîchir la liste des examens
          loadExams();
        }}
      />
    </div>
  );
};

export default Exams;
