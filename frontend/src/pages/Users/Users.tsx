import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Mail, Calendar, RefreshCw } from 'lucide-react';
import { apiService } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface UserData {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserData> & { is_active?: boolean; role?: string }>({});
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.get(API_ENDPOINTS.USERS.LIST);
      if (response.data) {
        setUsers(response.data);
      } else {
        setError(response.error || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      role: user.role,
      is_active: user.is_active,
    });
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (field: keyof typeof editForm, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    setModalError(null);
    try {
      const payload: Record<string, any> = {};
      if (editForm.full_name !== undefined) payload.full_name = editForm.full_name;
      if (editForm.email !== undefined) payload.email = editForm.email;
      if (editForm.username !== undefined) payload.username = editForm.username;
      if (editForm.role !== undefined) payload.role = editForm.role;
      if (editForm.is_active !== undefined) payload.is_active = editForm.is_active;

      const response = await apiService.put(
        API_ENDPOINTS.USERS.UPDATE(selectedUser.id),
        payload
      );

      if (response.error) {
        setModalError(response.error || "Erreur lors de la mise à jour de l'utilisateur");
        return;
      }

      // Rafraîchir la liste et fermer le modal
      await loadUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      setModalError(err.message || "Erreur lors de la mise à jour de l'utilisateur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await apiService.delete(API_ENDPOINTS.USERS.DELETE(userId));
      if (response.status === 200 || response.status === 204) {
        // Recharger la liste
        loadUsers();
      } else {
        alert(response.error || 'Erreur lors de la suppression');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'instructor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculer les statistiques
  const totalUsers = users.length;
  const students = users.filter(u => u.role === 'student').length;
  const admins = users.filter(u => u.role === 'admin').length;
  const activeUsers = users.filter(u => u.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Gérez les comptes étudiants et administrateurs</p>
        </div>
        <button
          onClick={loadUsers}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Utilisateurs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Étudiants
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{students}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Administrateurs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{admins}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Actifs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{activeUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom d'utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.full_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role === 'admin' ? 'Administrateur' : user.role === 'instructor' ? 'Enseignant' : 'Étudiant'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            user.is_active ? 'active' : 'inactive'
                          )}`}
                        >
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => openEditModal(user)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {currentUser?.role === 'admin' && currentUser?.id !== user.id && (
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal d'édition utilisateur */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Modifier l'utilisateur
            </h2>

            {modalError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editForm.full_name ?? ''}
                  onChange={(e) => handleEditChange('full_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editForm.email ?? ''}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editForm.username ?? ''}
                  onChange={(e) => handleEditChange('username', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rôle
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={editForm.role ?? 'student'}
                    onChange={(e) => handleEditChange('role', e.target.value)}
                  >
                    <option value="student">Étudiant</option>
                    <option value="instructor">Enseignant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className="flex items-center mt-6">
                  <input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={editForm.is_active ?? false}
                    onChange={(e) => handleEditChange('is_active', e.target.checked)}
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Compte actif
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSaveUser}
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
