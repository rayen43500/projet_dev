import React, { useState } from 'react';
import { X, Save, Upload, BookOpen, Clock, FileText, Users, CheckCircle } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import FileUpload from './ui/FileUpload';
import Badge from './ui/Badge';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface ExamFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (examData: any) => void;
  students: User[];
  loading?: boolean;
}

export default function ExamForm({
  isOpen,
  onClose,
  onSubmit,
  students,
  loading = false
}: ExamFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    status: 'draft',
    instructions: '',
    selected_students: [] as number[]
  });
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStudentToggle = (studentId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_students: prev.selected_students.includes(studentId)
        ? prev.selected_students.filter(id => id !== studentId)
        : [...prev.selected_students, studentId]
    }));
  };

  const handleSelectAllStudents = () => {
    const activeStudents = students.filter(s => s.is_active && s.role === 'student');
    setFormData(prev => ({
      ...prev,
      selected_students: activeStudents.map(s => s.id)
    }));
  };

  const handleDeselectAllStudents = () => {
    setFormData(prev => ({
      ...prev,
      selected_students: []
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (formData.duration_minutes < 1) {
      newErrors.duration_minutes = 'La durée doit être d\'au moins 1 minute';
    }
    
    if (formData.selected_students.length === 0) {
      newErrors.selected_students = 'Veuillez sélectionner au moins un étudiant';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const examData = {
        ...formData,
        instructor_id: 1, // ID de l'instructeur par défaut
        pdf_file: pdfFile
      };
      
      await onSubmit(examData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        duration_minutes: 60,
        status: 'draft',
        instructions: '',
        selected_students: []
      });
      setPdfFile(null);
      setErrors({});
    } catch (error) {
      console.error('Erreur lors de la création de l\'examen:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'published', label: 'Publié' },
    { value: 'archived', label: 'Archivé' }
  ];

  const activeStudents = students.filter(s => s.is_active && s.role === 'student');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Créer un Examen</h2>
                <p className="text-sm text-gray-600">Remplissez les informations de l'examen</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Informations de base */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-500" />
                Informations de base
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Titre de l'examen *"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={errors.title}
                  placeholder="Ex: Examen de Mathématiques"
                  className="md:col-span-2"
                />
                
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description de l'examen..."
                  rows={3}
                  className="md:col-span-2"
                />
                
                <Input
                  label="Durée (minutes) *"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                  error={errors.duration_minutes}
                  min="1"
                  max="480"
                />
                
                <Select
                  label="Statut"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  options={statusOptions}
                />
              </div>
            </Card>

            {/* Instructions */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-500" />
                Instructions
              </h3>
              
              <Textarea
                label="Instructions pour les étudiants"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Ex: Lisez attentivement les questions. Vous avez 60 minutes pour terminer l'examen..."
                rows={4}
                helperText="Ces instructions seront affichées aux étudiants avant de commencer l'examen"
              />
            </Card>

            {/* Document PDF */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-primary-500" />
                Document PDF (optionnel)
              </h3>
              
              <FileUpload
                accept=".pdf"
                maxSize={10}
                onFileSelect={setPdfFile}
                onFileRemove={() => setPdfFile(null)}
                helperText="Téléchargez le document PDF de l'examen (max 10MB)"
              />
            </Card>

            {/* Sélection des étudiants */}
            <Card variant="outlined" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary-500" />
                  Étudiants assignés *
                </h3>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllStudents}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllStudents}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>
              
              {errors.selected_students && (
                <p className="text-sm text-danger-600 mb-3">{errors.selected_students}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                {activeStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      formData.selected_students.includes(student.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleStudentToggle(student.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        formData.selected_students.includes(student.id)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.selected_students.includes(student.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {formData.selected_students.length} étudiant(s) sélectionné(s)
                </p>
                <Badge variant="primary" size="sm">
                  {activeStudents.length} disponible(s)
                </Badge>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                icon={Save}
                disabled={loading}
              >
                {isSubmitting ? 'Création...' : 'Créer l\'examen'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
