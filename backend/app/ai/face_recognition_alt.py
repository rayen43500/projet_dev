"""
Module de reconnaissance faciale alternatif pour Windows
Utilise OpenCV et des techniques de base pour la détection et comparaison
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class FaceRecognitionEngineAlt:
    """
    Moteur de reconnaissance faciale alternatif utilisant OpenCV
    Compatible Windows, sans dépendance MediaPipe
    """
    
    def __init__(self):
        """Initialise le moteur de reconnaissance faciale"""
        try:
            # Charger le classificateur Haar pour la détection de visages
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            # Charger le classificateur pour les yeux (validation supplémentaire)
            self.eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml'
            )
            
            logger.info("Moteur de reconnaissance faciale alternatif initialisé")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation: {e}")
            raise
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Détecte les visages dans une image
        
        Args:
            image: Image numpy (BGR)
            
        Returns:
            Liste des rectangles (x, y, w, h) des visages détectés
        """
        try:
            # Convertir en niveaux de gris
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Détecter les visages
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            # Valider avec la détection des yeux
            validated_faces = []
            for (x, y, w, h) in faces:
                roi_gray = gray[y:y+h, x:x+w]
                eyes = self.eye_cascade.detectMultiScale(roi_gray)
                
                # Si au moins un œil est détecté, le visage est valide
                if len(eyes) >= 1:
                    validated_faces.append((x, y, w, h))
            
            return validated_faces
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection des visages: {e}")
            return []
    
    def extract_face_features(self, image: np.ndarray, face_rect: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        """
        Extrait les caractéristiques d'un visage
        
        Args:
            image: Image numpy (BGR)
            face_rect: Rectangle du visage (x, y, w, h)
            
        Returns:
            Vecteur de caractéristiques ou None
        """
        try:
            x, y, w, h = face_rect
            
            # Extraire la région du visage
            face_roi = image[y:y+h, x:x+w]
            
            # Redimensionner à une taille standard
            face_resized = cv2.resize(face_roi, (128, 128))
            
            # Convertir en niveaux de gris
            face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
            
            # Normaliser les valeurs
            face_normalized = face_gray.astype(np.float32) / 255.0
            
            # Extraire des caractéristiques simples (histogramme, gradients)
            features = self._extract_simple_features(face_normalized)
            
            return features
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des caractéristiques: {e}")
            return None
    
    def _extract_simple_features(self, face_image: np.ndarray) -> np.ndarray:
        """
        Extrait des caractéristiques simples d'une image de visage
        
        Args:
            face_image: Image de visage normalisée
            
        Returns:
            Vecteur de caractéristiques
        """
        features = []
        
        # Histogramme des niveaux de gris
        hist = cv2.calcHist([face_image], [0], None, [32], [0, 1])
        hist_normalized = hist.flatten() / np.sum(hist)
        features.extend(hist_normalized)
        
        # Gradients (Sobel)
        grad_x = cv2.Sobel(face_image, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(face_image, cv2.CV_64F, 0, 1, ksize=3)
        
        # Magnitude des gradients
        magnitude = np.sqrt(grad_x**2 + grad_y**2)
        magnitude_normalized = magnitude.flatten() / np.max(magnitude)
        
        # Prendre un échantillon des gradients
        sample_size = min(1000, len(magnitude_normalized))
        indices = np.linspace(0, len(magnitude_normalized)-1, sample_size, dtype=int)
        features.extend(magnitude_normalized[indices])
        
        return np.array(features, dtype=np.float32)
    
    def compare_faces(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """
        Compare deux visages et retourne un score de similarité
        
        Args:
            features1: Caractéristiques du premier visage
            features2: Caractéristiques du second visage
            
        Returns:
            Score de similarité (0-1, 1 = identique)
        """
        try:
            # Vérifier que les vecteurs ont la même taille
            if features1.shape != features2.shape:
                # Redimensionner le plus petit vecteur
                min_size = min(len(features1), len(features2))
                features1 = features1[:min_size]
                features2 = features2[:min_size]
            
            # Calculer la similarité cosinus
            dot_product = np.dot(features1, features2)
            norm1 = np.linalg.norm(features1)
            norm2 = np.linalg.norm(features2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            
            # Normaliser entre 0 et 1
            similarity = (similarity + 1) / 2
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Erreur lors de la comparaison: {e}")
            return 0.0
    
    def verify_identity(self, reference_image: np.ndarray, current_image: np.ndarray, 
                       threshold: float = 0.7) -> Tuple[bool, float, str]:
        """
        Vérifie l'identité en comparant deux images
        
        Args:
            reference_image: Image de référence (pièce d'identité)
            current_image: Image actuelle (webcam)
            threshold: Seuil de similarité
            
        Returns:
            Tuple (verified, confidence, message)
        """
        try:
            # Détecter les visages dans les deux images
            ref_faces = self.detect_faces(reference_image)
            cur_faces = self.detect_faces(current_image)
            
            if not ref_faces:
                return False, 0.0, "Aucun visage détecté dans l'image de référence"
            
            if not cur_faces:
                return False, 0.0, "Aucun visage détecté dans l'image actuelle"
            
            # Prendre le premier visage de chaque image
            ref_face = ref_faces[0]
            cur_face = cur_faces[0]
            
            # Extraire les caractéristiques
            ref_features = self.extract_face_features(reference_image, ref_face)
            cur_features = self.extract_face_features(current_image, cur_face)
            
            if ref_features is None or cur_features is None:
                return False, 0.0, "Impossible d'extraire les caractéristiques des visages"
            
            # Comparer les visages
            similarity = self.compare_faces(ref_features, cur_features)
            
            # Déterminer le résultat
            verified = similarity >= threshold
            
            if verified:
                message = f"Identité vérifiée avec une confiance de {similarity:.2%}"
            else:
                message = f"Identité non vérifiée. Confiance: {similarity:.2%} (seuil: {threshold:.2%})"
            
            return verified, similarity, message
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification d'identité: {e}")
            return False, 0.0, f"Erreur lors de la vérification: {str(e)}"
    
    def analyze_face_behavior(self, image: np.ndarray) -> dict:
        """
        Analyse le comportement du visage dans une image
        
        Args:
            image: Image numpy (BGR)
            
        Returns:
            Dictionnaire avec les résultats de l'analyse
        """
        try:
            faces = self.detect_faces(image)
            
            if not faces:
                return {
                    "face_detected": False,
                    "face_count": 0,
                    "visibility": 0.0,
                    "message": "Aucun visage détecté"
                }
            
            # Analyser chaque visage
            results = []
            for face_rect in faces:
                x, y, w, h = face_rect
                
                # Calculer la visibilité (taille relative)
                image_area = image.shape[0] * image.shape[1]
                face_area = w * h
                visibility = face_area / image_area
                
                # Vérifier la position (centré = mieux)
                center_x = x + w/2
                center_y = y + h/2
                image_center_x = image.shape[1] / 2
                image_center_y = image.shape[0] / 2
                
                distance_from_center = np.sqrt(
                    (center_x - image_center_x)**2 + 
                    (center_y - image_center_y)**2
                )
                
                max_distance = np.sqrt(image_center_x**2 + image_center_y**2)
                centering_score = 1.0 - (distance_from_center / max_distance)
                
                results.append({
                    "position": (x, y, w, h),
                    "visibility": visibility,
                    "centering": centering_score,
                    "size": (w, h)
                })
            
            # Résultats globaux
            total_visibility = sum(r["visibility"] for r in results)
            avg_centering = np.mean([r["centering"] for r in results])
            
            return {
                "face_detected": True,
                "face_count": len(faces),
                "visibility": total_visibility,
                "centering_score": avg_centering,
                "faces": results,
                "message": f"{len(faces)} visage(s) détecté(s)"
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse comportementale: {e}")
            return {
                "face_detected": False,
                "face_count": 0,
                "visibility": 0.0,
                "message": f"Erreur lors de l'analyse: {str(e)}"
            }
