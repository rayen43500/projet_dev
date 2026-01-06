"""
Service de reconnaissance faciale pour ProctoFlex AI
Détection et vérification d'identité par IA
"""

import cv2
import numpy as np
import face_recognition
from typing import List, Dict, Tuple, Optional
import logging
from PIL import Image
import io
import base64

logger = logging.getLogger(__name__)

class FaceDetectionService:
    """
    Service de détection et reconnaissance faciale
    Utilise OpenCV et face_recognition pour l'analyse
    """
    
    def __init__(self):
        """Initialisation du service de reconnaissance faciale"""
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        
        # Seuils de confiance
        self.face_confidence_threshold = 0.8
        self.recognition_threshold = 0.6
        self.min_face_size = (30, 30)
        
        logger.info("Service de reconnaissance faciale initialisé")
    
    def decode_base64_image(self, image_data: str) -> np.ndarray:
        """
        Décode une image base64 en array numpy
        
        Args:
            image_data: Image encodée en base64
            
        Returns:
            Array numpy de l'image
        """
        try:
            # Supprimer le préfixe data:image/...;base64, si présent
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Décoder l'image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convertir en RGB si nécessaire
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convertir en array numpy
            return np.array(image)
        
        except Exception as e:
            logger.error(f"Erreur lors du décodage de l'image: {e}")
            raise ValueError("Format d'image invalide")
    
    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """
        Détecte les visages dans une image
        
        Args:
            image: Image en format numpy array
            
        Returns:
            Liste des visages détectés avec leurs coordonnées
        """
        try:
            # Convertir en niveaux de gris pour la détection
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Détecter les visages
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=self.min_face_size
            )
            
            results = []
            for (x, y, w, h) in faces:
                face_data = {
                    'bbox': [int(x), int(y), int(w), int(h)],
                    'confidence': 0.9,  # Confiance par défaut pour OpenCV
                    'landmarks': self._extract_landmarks(gray[y:y+h, x:x+w])
                }
                results.append(face_data)
            
            logger.info(f"Détecté {len(results)} visage(s) dans l'image")
            return results
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection des visages: {e}")
            return []
    
    def _extract_landmarks(self, face_image: np.ndarray) -> Dict:
        """
        Extrait les points de repère du visage
        
        Args:
            face_image: Image du visage
            
        Returns:
            Dictionnaire des points de repère
        """
        try:
            # Utiliser face_recognition pour les landmarks
            face_landmarks_list = face_recognition.face_landmarks(face_image)
            
            if face_landmarks_list:
                landmarks = face_landmarks_list[0]
                return {
                    'left_eye': landmarks.get('left_eye', []),
                    'right_eye': landmarks.get('right_eye', []),
                    'nose': landmarks.get('nose_bridge', []),
                    'mouth': landmarks.get('top_lip', []) + landmarks.get('bottom_lip', [])
                }
            
            return {}
            
        except Exception as e:
            logger.warning(f"Impossible d'extraire les landmarks: {e}")
            return {}
    
    def verify_identity(self, current_image: str, reference_image: str) -> Dict:
        """
        Vérifie l'identité en comparant deux images
        
        Args:
            current_image: Image actuelle (base64)
            reference_image: Image de référence (base64)
            
        Returns:
            Résultat de la vérification
        """
        try:
            # Décoder les images
            current_img = self.decode_base64_image(current_image)
            reference_img = self.decode_base64_image(reference_image)
            
            # Détecter les visages
            current_faces = self.detect_faces(current_img)
            reference_faces = self.detect_faces(reference_img)
            
            if not current_faces:
                return {
                    'verified': False,
                    'confidence': 0.0,
                    'reason': 'Aucun visage détecté dans l\'image actuelle'
                }
            
            if not reference_faces:
                return {
                    'verified': False,
                    'confidence': 0.0,
                    'reason': 'Aucun visage détecté dans l\'image de référence'
                }
            
            # Extraire les encodages faciaux
            current_encodings = face_recognition.face_encodings(current_img)
            reference_encodings = face_recognition.face_encodings(reference_img)
            
            if not current_encodings:
                return {
                    'verified': False,
                    'confidence': 0.0,
                    'reason': 'Impossible d\'encoder le visage actuel'
                }
            
            if not reference_encodings:
                return {
                    'verified': False,
                    'confidence': 0.0,
                    'reason': 'Impossible d\'encoder le visage de référence'
                }
            
            # Comparer les visages
            current_encoding = current_encodings[0]
            reference_encoding = reference_encodings[0]
            
            # Calculer la distance
            distance = face_recognition.face_distance([reference_encoding], current_encoding)[0]
            
            # Convertir en score de confiance (0-1)
            confidence = 1.0 - distance
            
            # Déterminer si c'est la même personne
            verified = confidence >= self.recognition_threshold
            
            result = {
                'verified': verified,
                'confidence': float(confidence),
                'distance': float(distance),
                'threshold': self.recognition_threshold,
                'reason': 'Identité vérifiée' if verified else 'Identité non vérifiée'
            }
            
            logger.info(f"Vérification d'identité: {confidence:.3f} (seuil: {self.recognition_threshold})")
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification d'identité: {e}")
            return {
                'verified': False,
                'confidence': 0.0,
                'reason': f'Erreur technique: {str(e)}'
            }
    
    def analyze_face_quality(self, image: str) -> Dict:
        """
        Analyse la qualité de l'image pour la reconnaissance faciale
        
        Args:
            image: Image en base64
            
        Returns:
            Analyse de la qualité
        """
        try:
            img = self.decode_base64_image(image)
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
            
            # Détecter les visages
            faces = self.detect_faces(img)
            
            if not faces:
                return {
                    'quality_score': 0.0,
                    'issues': ['Aucun visage détecté'],
                    'recommendations': ['Assurez-vous que votre visage est visible']
                }
            
            face = faces[0]
            face_region = gray[face['bbox'][1]:face['bbox'][1]+face['bbox'][3], 
                              face['bbox'][0]:face['bbox'][0]+face['bbox'][2]]
            
            # Analyser la luminosité
            brightness = np.mean(face_region)
            brightness_score = min(1.0, brightness / 128.0)
            
            # Analyser le contraste
            contrast = np.std(face_region)
            contrast_score = min(1.0, contrast / 50.0)
            
            # Analyser la netteté
            laplacian_var = cv2.Laplacian(face_region, cv2.CV_64F).var()
            sharpness_score = min(1.0, laplacian_var / 100.0)
            
            # Score global
            quality_score = (brightness_score + contrast_score + sharpness_score) / 3.0
            
            # Identifier les problèmes
            issues = []
            recommendations = []
            
            if brightness_score < 0.5:
                issues.append('Éclairage insuffisant')
                recommendations.append('Améliorez l\'éclairage de votre visage')
            
            if contrast_score < 0.5:
                issues.append('Contraste faible')
                recommendations.append('Évitez les arrière-plans clairs')
            
            if sharpness_score < 0.5:
                issues.append('Image floue')
                recommendations.append('Assurez-vous que la caméra est stable')
            
            return {
                'quality_score': float(quality_score),
                'brightness_score': float(brightness_score),
                'contrast_score': float(contrast_score),
                'sharpness_score': float(sharpness_score),
                'issues': issues,
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de qualité: {e}")
            return {
                'quality_score': 0.0,
                'issues': ['Erreur d\'analyse'],
                'recommendations': ['Réessayez de prendre la photo']
            }
    
    def detect_multiple_faces(self, image: str) -> Dict:
        """
        Détecte la présence de plusieurs visages
        
        Args:
            image: Image en base64
            
        Returns:
            Résultat de la détection
        """
        try:
            img = self.decode_base64_image(image)
            faces = self.detect_faces(img)
            
            return {
                'face_count': len(faces),
                'multiple_faces': len(faces) > 1,
                'positions': [face['bbox'] for face in faces],
                'warning': len(faces) > 1
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection multiple: {e}")
            return {
                'face_count': 0,
                'multiple_faces': False,
                'positions': [],
                'warning': False
            }
    
    def track_gaze(self, image: str, face_bbox: List[int]) -> Dict:
        """
        Analyse la direction du regard
        
        Args:
            image: Image en base64
            face_bbox: Coordonnées du visage [x, y, w, h]
            
        Returns:
            Analyse du regard
        """
        try:
            img = self.decode_base64_image(image)
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
            
            # Extraire la région du visage
            x, y, w, h = face_bbox
            face_roi = gray[y:y+h, x:x+w]
            
            # Détecter les yeux
            eyes = self.eye_cascade.detectMultiScale(face_roi)
            
            if len(eyes) < 2:
                return {
                    'gaze_detected': False,
                    'looking_at_screen': False,
                    'confidence': 0.0,
                    'reason': 'Yeux non détectés'
                }
            
            # Analyser la position des yeux
            eye_positions = []
            for (ex, ey, ew, eh) in eyes:
                eye_center = (ex + ew//2, ey + eh//2)
                eye_positions.append(eye_center)
            
            # Calculer la direction du regard (simplifié)
            # En production, utiliser un modèle plus sophistiqué
            avg_eye_x = sum(pos[0] for pos in eye_positions) / len(eye_positions)
            face_center_x = w // 2
            
            # Déterminer si le regard est centré
            gaze_offset = abs(avg_eye_x - face_center_x) / face_center_x
            looking_at_screen = gaze_offset < 0.3
            
            return {
                'gaze_detected': True,
                'looking_at_screen': looking_at_screen,
                'confidence': max(0.0, 1.0 - gaze_offset),
                'eye_positions': eye_positions,
                'gaze_offset': float(gaze_offset)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du suivi du regard: {e}")
            return {
                'gaze_detected': False,
                'looking_at_screen': False,
                'confidence': 0.0,
                'reason': 'Erreur d\'analyse'
            }

# Instance globale du service
face_detection_service = FaceDetectionService()
