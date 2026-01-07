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
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [examDetails, setExamDetails] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    duration_minutes: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  } | null>(null);

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
            students: (exam as any).assigned_students_count || 0, // Nombre d'étudiants assignés
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

  const loadExamDetails = async (id: number) => {
    setModalLoading(true);
    setModalError(null);
    try {
      const response = await apiService.get(API_ENDPOINTS.EXAMS.GET(id));
      if (response.error) {
        setModalError(response.error);
        return null;
      }
      if (response.data) {
        setExamDetails(response.data);
        return response.data;
      }
      return null;
    } catch (err: any) {
      setModalError(err.message || "Erreur lors du chargement de l'examen");
      return null;
    } finally {
      setModalLoading(false);
    }
  };

  const openViewExam = async (id: number) => {
    setSelectedExamId(id);
    const details = await loadExamDetails(id);
    if (details) {
      setIsViewModalOpen(true);
      setIsEditModalOpen(false);
    }
  };

  const openEditExam = async (id: number) => {
    setSelectedExamId(id);
    const details = await loadExamDetails(id);
    if (details) {
      setEditForm({
        title: details.title || "",
        description: details.description || "",
        duration_minutes: details.duration_minutes || 60,
        start_time: details.start_time
          ? new Date(details.start_time).toISOString().slice(0, 16)
          : "",
        end_time: details.end_time
          ? new Date(details.end_time).toISOString().slice(0, 16)
          : "",
        is_active: details.is_active ?? true,
      });
      setIsEditModalOpen(true);
      setIsViewModalOpen(false);
    }
  };

  const handleEditChange = (
    field: keyof NonNullable<typeof editForm>,
    value: any
  ) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : prev
    );
  };

  const handleSaveExam = async () => {
    if (!selectedExamId || !editForm) return;
    setModalLoading(true);
    setModalError(null);
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        duration_minutes: editForm.duration_minutes,
        start_time: new Date(editForm.start_time).toISOString(),
        end_time: new Date(editForm.end_time).toISOString(),
        is_active: editForm.is_active,
      };
      const response = await apiService.put(
        API_ENDPOINTS.EXAMS.UPDATE(selectedExamId),
        payload
      );
      if (response.error) {
        setModalError(
          response.error || "Erreur lors de la mise à jour de l'examen"
        );
        return;
      }
      await loadExams();
      setIsEditModalOpen(false);
      setSelectedExamId(null);
    } catch (err: any) {
      setModalError(
        err.message || "Erreur lors de la mise à jour de l'examen"
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet examen ?")) {
      return;
    }
    try {
      const response = await apiService.delete(API_ENDPOINTS.EXAMS.DELETE(id));
      if (response.error) {
        alert(response.error || "Erreur lors de la suppression de l'examen");
        return;
      }
      await loadExams();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression de l'examen");
    }
  };

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
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                          onClick={() => openViewExam(exam.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Modifier"
                          onClick={() => openEditExam(exam.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                          onClick={() => handleDeleteExam(exam.id)}
                        >
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

      {/* Modal de visualisation d'examen */}
      {isViewModalOpen && examDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Détails de l'examen
            </h2>

            {modalError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {modalError}
              </div>
            )}

            {modalLoading ? (
              <div className="py-4 text-gray-500 text-sm">Chargement...</div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Titre : </span>
                  {examDetails.title}
                </div>
                {examDetails.description && (
                  <div>
                    <span className="font-medium">Description : </span>
                    {examDetails.description}
                  </div>
                )}
                <div>
                  <span className="font-medium">Durée : </span>
                  {examDetails.duration_minutes} minutes
                </div>
                <div>
                  <span className="font-medium">Début : </span>
                  {examDetails.start_time
                    ? new Date(examDetails.start_time).toLocaleString("fr-FR")
                    : "-"}
                </div>
                <div>
                  <span className="font-medium">Fin : </span>
                  {examDetails.end_time
                    ? new Date(examDetails.end_time).toLocaleString("fr-FR")
                    : "-"}
                </div>
                <div>
                  <span className="font-medium">Statut : </span>
                  {examDetails.is_active ? "Actif" : "Inactif"}
                </div>
                {examDetails.assigned_students_count !== undefined && (
                  <div>
                    <span className="font-medium">Étudiants assignés : </span>
                    {examDetails.assigned_students_count}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedExamId(null);
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'examen */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Modifier l'examen
            </h2>

            {modalError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titre
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editForm.title}
                  onChange={(e) => handleEditChange("title", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    handleEditChange("description", e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={editForm.duration_minutes}
                    onChange={(e) =>
                      handleEditChange(
                        "duration_minutes",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                  />
                </div>
                <div className="flex items-center mt-6">
                  <input
                    id="exam_is_active"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={editForm.is_active}
                    onChange={(e) =>
                      handleEditChange("is_active", e.target.checked)
                    }
                  />
                  <label
                    htmlFor="exam_is_active"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Examen actif
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Début
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={editForm.start_time}
                    onChange={(e) =>
                      handleEditChange("start_time", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fin
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={editForm.end_time}
                    onChange={(e) =>
                      handleEditChange("end_time", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedExamId(null);
                }}
                disabled={modalLoading}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSaveExam}
                disabled={modalLoading}
              >
                {modalLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

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
