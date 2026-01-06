"""
Module de reconnaissance faciale ProctoFlex AI
Utilise OpenCV et MediaPipe pour la vérification d'identité
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Tuple, Optional, List
import face_recognition
from PIL import Image
import io
import base64

class FaceRecognitionEngine:
    """Moteur de reconnaissance faciale pour la surveillance d'examen"""
    
    def __init__(self):
        # Initialisation de MediaPipe
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Configuration des modèles
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1, min_detection_confidence=0.5
        )
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Seuils de confiance
        self.face_detection_confidence = 0.8
        self.identity_verification_confidence = 0.7
        
    def detect_faces(self, image: np.ndarray) -> List[dict]:
        """
        Détecte les visages dans une image
        
        Args:
            image: Image numpy array (BGR)
            
        Returns:
            Liste des détections avec coordonnées et confiance
        """
        # Conversion BGR vers RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Détection des visages
        results = self.face_detection.process(rgb_image)
        
        faces = []
        if results.detections:
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                h, w, _ = image.shape
                
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                faces.append({
                    'bbox': (x, y, width, height),
                    'confidence': detection.score[0],
                    'keypoints': detection.location_data.relative_keypoints
                })
        
        return faces
    
    def extract_face_encoding(self, image: np.ndarray, face_bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        """
        Extrait l'encodage facial d'un visage détecté
        
        Args:
            image: Image numpy array
            face_bbox: Boîte englobante du visage (x, y, width, height)
            
        Returns:
            Encodage facial ou None si échec
        """
        try:
            x, y, w, h = face_bbox
            face_image = image[y:y+h, x:x+w]
            
            # Redimensionnement pour la reconnaissance
            face_image = cv2.resize(face_image, (160, 160))
            
            # Conversion vers RGB
            face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # Extraction de l'encodage
            encodings = face_recognition.face_encodings(face_rgb)
            
            if encodings:
                return encodings[0]
            return None
            
        except Exception as e:
            print(f"Erreur lors de l'extraction de l'encodage facial: {e}")
            return None
    
    def verify_identity(self, reference_image: np.ndarray, current_image: np.ndarray) -> dict:
        """
        Vérifie l'identité en comparant deux images
        
        Args:
            reference_image: Image de référence (pièce d'identité)
            current_image: Image actuelle (webcam)
            
        Returns:
            Résultat de la vérification avec score de confiance
        """
        try:
            # Détection des visages dans les deux images
            ref_faces = self.detect_faces(reference_image)
            cur_faces = self.detect_faces(current_image)
            
            if not ref_faces or not cur_faces:
                return {
                    'verified': False,
                    'confidence': 0.0,
                    'error': 'Aucun visage détecté dans une ou les deux images'
                }
            
            # Extraction des encodages
            ref_encoding = self.extract_face_encoding(reference_image, ref_faces[0]['bbox'])
            cur_encoding = self.extract_face_encoding(current_image, cur_faces[0]['bbox'])
            
            if ref_encoding is None or cur_encoding is None:
                return {
                    'verified': False,
                    'confidence': 0.0,
                    'error': 'Impossible d\'extraire les encodages faciaux'
                }
            
            # Calcul de la distance entre les encodages
            distance = face_recognition.face_distance([ref_encoding], cur_encoding)[0]
            
            # Conversion en score de confiance (0-1)
            confidence = 1.0 - distance
            
            # Vérification selon le seuil
            verified = confidence >= self.identity_verification_confidence
            
            return {
                'verified': verified,
                'confidence': confidence,
                'distance': distance,
                'threshold': self.identity_verification_confidence
            }
            
        except Exception as e:
            return {
                'verified': False,
                'confidence': 0.0,
                'error': f'Erreur lors de la vérification: {str(e)}'
            }
    
    def analyze_face_behavior(self, image: np.ndarray) -> dict:
        """
        Analyse le comportement du visage (présence, orientation, etc.)
        
        Args:
            image: Image de la webcam
            
        Returns:
            Analyse du comportement facial
        """
        try:
            # Détection des visages
            faces = self.detect_faces(image)
            
            if not faces:
                return {
                    'face_detected': False,
                    'multiple_faces': False,
                    'face_visible': False,
                    'confidence': 0.0
                }
            
            # Vérification de la présence de plusieurs visages
            multiple_faces = len(faces) > 1
            
            # Analyse de la visibilité du visage principal
            main_face = faces[0]
            face_visible = main_face['confidence'] >= self.face_detection_confidence
            
            return {
                'face_detected': True,
                'multiple_faces': multiple_faces,
                'face_visible': face_visible,
                'confidence': main_face['confidence'],
                'face_count': len(faces)
            }
            
        except Exception as e:
            return {
                'face_detected': False,
                'multiple_faces': False,
                'face_visible': False,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def detect_suspicious_objects(self, image: np.ndarray) -> dict:
        """
        Détecte des objets suspects (téléphones, tablettes, etc.)
        
        Args:
            image: Image de la webcam
            
        Returns:
            Résultats de la détection d'objets
        """
        # TODO: Implémenter la détection d'objets avec YOLO ou autre modèle
        # Pour l'instant, retourne un résultat de base
        return {
            'suspicious_objects_detected': False,
            'objects_found': [],
            'confidence': 0.0
        }
    
    def cleanup(self):
        """Libère les ressources"""
        self.face_detection.close()
        self.face_mesh.close()
