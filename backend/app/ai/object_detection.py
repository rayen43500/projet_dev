"""
Service de détection d'objets pour ProctoFlex AI
Détection d'objets suspects (téléphones, tablettes, etc.)
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
from PIL import Image
import io
import base64
import json
import os

logger = logging.getLogger(__name__)

class ObjectDetectionService:
    """
    Service de détection d'objets suspects
    Utilise OpenCV et des modèles pré-entraînés
    """
    
    def __init__(self):
        """Initialisation du service de détection d'objets"""
        # Charger le modèle YOLO (si disponible)
        self.model_path = os.getenv('YOLO_MODEL_PATH', 'models/yolov5s.pt')
        self.confidence_threshold = 0.5
        self.nms_threshold = 0.4
        
        # Classes d'objets suspects
        self.suspicious_classes = {
            'phone': ['cell phone', 'mobile phone', 'smartphone'],
            'tablet': ['tablet', 'ipad', 'android tablet'],
            'laptop': ['laptop', 'notebook'],
            'book': ['book', 'textbook', 'notebook'],
            'paper': ['paper', 'document', 'sheet'],
            'headphones': ['headphones', 'earphones', 'earbuds']
        }
        
        # Initialiser le modèle
        self.model = self._load_model()
        
        logger.info("Service de détection d'objets initialisé")
    
    def _load_model(self):
        """
        Charge le modèle de détection d'objets
        
        Returns:
            Modèle chargé ou None si non disponible
        """
        try:
            # Essayer de charger YOLO
            import torch
            model = torch.hub.load('ultralytics/yolov5', 'custom', path=self.model_path)
            model.conf = self.confidence_threshold
            model.iou = self.nms_threshold
            logger.info("Modèle YOLO chargé avec succès")
            return model
        except Exception as e:
            logger.warning(f"Impossible de charger YOLO: {e}")
            logger.info("Utilisation de la détection OpenCV basique")
            return None
    
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
    
    def detect_objects_yolo(self, image: np.ndarray) -> List[Dict]:
        """
        Détecte les objets avec YOLO
        
        Args:
            image: Image en format numpy array
            
        Returns:
            Liste des objets détectés
        """
        if self.model is None:
            return []
        
        try:
            # Effectuer la détection
            results = self.model(image)
            
            detections = []
            for *xyxy, conf, cls in results.xyxy[0]:
                if conf >= self.confidence_threshold:
                    class_name = results.names[int(cls)]
                    
                    # Vérifier si c'est un objet suspect
                    suspicious_type = self._classify_suspicious_object(class_name)
                    
                    if suspicious_type:
                        detection = {
                            'bbox': [int(x) for x in xyxy],
                            'confidence': float(conf),
                            'class_name': class_name,
                            'suspicious_type': suspicious_type,
                            'severity': self._get_severity_level(suspicious_type)
                        }
                        detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection YOLO: {e}")
            return []
    
    def detect_objects_opencv(self, image: np.ndarray) -> List[Dict]:
        """
        Détecte les objets avec OpenCV (méthode basique)
        
        Args:
            image: Image en format numpy array
            
        Returns:
            Liste des objets détectés
        """
        try:
            # Convertir en niveaux de gris
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Détecter les contours
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 50, 150)
            
            # Trouver les contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            detections = []
            for contour in contours:
                # Filtrer les petits contours
                area = cv2.contourArea(contour)
                if area < 1000:  # Seuil minimal
                    continue
                
                # Obtenir le rectangle englobant
                x, y, w, h = cv2.boundingRect(contour)
                
                # Analyser la forme et la taille
                aspect_ratio = w / h if h > 0 else 0
                
                # Classification basique basée sur la forme
                suspicious_type = self._classify_by_shape(aspect_ratio, area, w, h)
                
                if suspicious_type:
                    detection = {
                        'bbox': [x, y, x + w, y + h],
                        'confidence': 0.6,  # Confiance modérée pour OpenCV
                        'class_name': suspicious_type,
                        'suspicious_type': suspicious_type,
                        'severity': self._get_severity_level(suspicious_type),
                        'area': area,
                        'aspect_ratio': aspect_ratio
                    }
                    detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection OpenCV: {e}")
            return []
    
    def _classify_suspicious_object(self, class_name: str) -> Optional[str]:
        """
        Classifie un objet comme suspect
        
        Args:
            class_name: Nom de la classe détectée
            
        Returns:
            Type d'objet suspect ou None
        """
        class_name_lower = class_name.lower()
        
        for suspicious_type, keywords in self.suspicious_classes.items():
            for keyword in keywords:
                if keyword in class_name_lower:
                    return suspicious_type
        
        return None
    
    def _classify_by_shape(self, aspect_ratio: float, area: float, width: int, height: int) -> Optional[str]:
        """
        Classifie un objet basé sur sa forme (méthode OpenCV)
        
        Args:
            aspect_ratio: Rapport largeur/hauteur
            area: Surface de l'objet
            width: Largeur
            height: Hauteur
            
        Returns:
            Type d'objet suspect ou None
        """
        # Classification basée sur la forme
        if 0.8 <= aspect_ratio <= 1.2 and area > 5000:
            # Forme carrée/rectangulaire - possible téléphone/tablette
            if area > 20000:
                return 'tablet'
            else:
                return 'phone'
        
        elif aspect_ratio > 1.5 and area > 10000:
            # Forme rectangulaire allongée - possible livre/document
            return 'book'
        
        elif aspect_ratio < 0.7 and area > 8000:
            # Forme verticale - possible document
            return 'paper'
        
        return None
    
    def _get_severity_level(self, suspicious_type: str) -> str:
        """
        Détermine le niveau de sévérité d'un objet suspect
        
        Args:
            suspicious_type: Type d'objet suspect
            
        Returns:
            Niveau de sévérité
        """
        severity_levels = {
            'phone': 'high',
            'tablet': 'high',
            'laptop': 'medium',
            'book': 'low',
            'paper': 'low',
            'headphones': 'medium'
        }
        
        return severity_levels.get(suspicious_type, 'low')
    
    def detect_suspicious_objects(self, image: str) -> Dict:
        """
        Détecte les objets suspects dans une image
        
        Args:
            image: Image en base64
            
        Returns:
            Résultat de la détection
        """
        try:
            # Décoder l'image
            img = self.decode_base64_image(image)
            
            # Détecter avec YOLO si disponible
            yolo_detections = self.detect_objects_yolo(img)
            
            # Détecter avec OpenCV comme fallback
            opencv_detections = self.detect_objects_opencv(img)
            
            # Combiner les résultats
            all_detections = yolo_detections + opencv_detections
            
            # Supprimer les doublons (basé sur la position)
            unique_detections = self._remove_duplicates(all_detections)
            
            # Analyser les résultats
            suspicious_count = len(unique_detections)
            high_severity = len([d for d in unique_detections if d['severity'] == 'high'])
            medium_severity = len([d for d in unique_detections if d['severity'] == 'medium'])
            
            # Déterminer le niveau d'alerte
            alert_level = self._determine_alert_level(high_severity, medium_severity, suspicious_count)
            
            result = {
                'objects_detected': suspicious_count,
                'alert_level': alert_level,
                'detections': unique_detections,
                'summary': {
                    'high_severity': high_severity,
                    'medium_severity': medium_severity,
                    'low_severity': suspicious_count - high_severity - medium_severity
                }
            }
            
            logger.info(f"Détecté {suspicious_count} objet(s) suspect(s), niveau d'alerte: {alert_level}")
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection d'objets: {e}")
            return {
                'objects_detected': 0,
                'alert_level': 'none',
                'detections': [],
                'summary': {'high_severity': 0, 'medium_severity': 0, 'low_severity': 0},
                'error': str(e)
            }
    
    def _remove_duplicates(self, detections: List[Dict]) -> List[Dict]:
        """
        Supprime les détections en double basées sur la position
        
        Args:
            detections: Liste des détections
            
        Returns:
            Liste sans doublons
        """
        unique_detections = []
        used_positions = []
        
        for detection in detections:
            bbox = detection['bbox']
            center = [(bbox[0] + bbox[2]) // 2, (bbox[1] + bbox[3]) // 2]
            
            # Vérifier si cette position est déjà utilisée
            is_duplicate = False
            for used_center in used_positions:
                distance = np.sqrt((center[0] - used_center[0])**2 + (center[1] - used_center[1])**2)
                if distance < 50:  # Seuil de 50 pixels
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_detections.append(detection)
                used_positions.append(center)
        
        return unique_detections
    
    def _determine_alert_level(self, high_severity: int, medium_severity: int, total: int) -> str:
        """
        Détermine le niveau d'alerte basé sur les objets détectés
        
        Args:
            high_severity: Nombre d'objets haute sévérité
            medium_severity: Nombre d'objets sévérité moyenne
            total: Nombre total d'objets
            
        Returns:
            Niveau d'alerte
        """
        if high_severity > 0:
            return 'critical'
        elif high_severity == 0 and medium_severity >= 2:
            return 'high'
        elif medium_severity == 1 or total >= 3:
            return 'medium'
        elif total > 0:
            return 'low'
        else:
            return 'none'
    
    def analyze_object_patterns(self, detections: List[Dict]) -> Dict:
        """
        Analyse les patterns d'objets détectés
        
        Args:
            detections: Liste des détections
            
        Returns:
            Analyse des patterns
        """
        try:
            if not detections:
                return {
                    'pattern_detected': False,
                    'risk_level': 'low',
                    'analysis': 'Aucun objet suspect détecté'
                }
            
            # Analyser les types d'objets
            object_types = [d['suspicious_type'] for d in detections]
            type_counts = {}
            for obj_type in object_types:
                type_counts[obj_type] = type_counts.get(obj_type, 0) + 1
            
            # Détecter les patterns suspects
            patterns = []
            risk_level = 'low'
            
            # Pattern: Téléphone + écouteurs
            if 'phone' in type_counts and 'headphones' in type_counts:
                patterns.append('phone_with_headphones')
                risk_level = 'high'
            
            # Pattern: Plusieurs appareils électroniques
            electronic_devices = sum(type_counts.get(t, 0) for t in ['phone', 'tablet', 'laptop'])
            if electronic_devices >= 2:
                patterns.append('multiple_electronic_devices')
                risk_level = 'high'
            
            # Pattern: Documents + appareils
            if ('book' in type_counts or 'paper' in type_counts) and electronic_devices > 0:
                patterns.append('documents_with_devices')
                risk_level = 'medium'
            
            # Pattern: Objets multiples du même type
            for obj_type, count in type_counts.items():
                if count >= 2:
                    patterns.append(f'multiple_{obj_type}')
                    if risk_level == 'low':
                        risk_level = 'medium'
            
            return {
                'pattern_detected': len(patterns) > 0,
                'patterns': patterns,
                'risk_level': risk_level,
                'object_distribution': type_counts,
                'analysis': self._generate_pattern_analysis(patterns, type_counts)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse des patterns: {e}")
            return {
                'pattern_detected': False,
                'risk_level': 'low',
                'analysis': 'Erreur d\'analyse'
            }
    
    def _generate_pattern_analysis(self, patterns: List[str], type_counts: Dict) -> str:
        """
        Génère une analyse textuelle des patterns détectés
        
        Args:
            patterns: Liste des patterns détectés
            type_counts: Distribution des types d'objets
            
        Returns:
            Analyse textuelle
        """
        if not patterns:
            return "Aucun pattern suspect détecté"
        
        analysis_parts = []
        
        for pattern in patterns:
            if pattern == 'phone_with_headphones':
                analysis_parts.append("Téléphone détecté avec écouteurs")
            elif pattern == 'multiple_electronic_devices':
                analysis_parts.append("Plusieurs appareils électroniques détectés")
            elif pattern == 'documents_with_devices':
                analysis_parts.append("Documents avec appareils électroniques")
            elif pattern.startswith('multiple_'):
                obj_type = pattern.replace('multiple_', '')
                count = type_counts.get(obj_type, 0)
                analysis_parts.append(f"Plusieurs {obj_type}s détectés ({count})")
        
        return ". ".join(analysis_parts) + "."

# Instance globale du service
object_detection_service = ObjectDetectionService()
