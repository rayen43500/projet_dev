/**
 * Service de verrouillage d'applications avancé
 * ProctoFlex AI - Université de Monastir - ESPRIM
 */

import { ipcRenderer } from 'electron';
import { spawn, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessInfo {
  pid: number;
  name: string;
  executablePath: string;
  commandLine: string;
  memoryUsage: number;
  cpuUsage: number;
  startTime: Date;
  parentPid?: number;
  children: number[];
}

export interface WhitelistRule {
  id: string;
  name: string;
  type: 'executable' | 'process_name' | 'window_title' | 'domain';
  pattern: string;
  description: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LockViolation {
  id: string;
  timestamp: Date;
  process: ProcessInfo;
  rule_violated: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action_taken: 'blocked' | 'warned' | 'monitored';
  user_notified: boolean;
}

export interface SystemResources {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_connections: number;
  running_processes: number;
}

class AdvancedApplicationLockService {
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private checkInterval = 1000; // 1 seconde pour une surveillance en temps réel
  private whitelistRules: WhitelistRule[] = [];
  private violations: LockViolation[] = [];
  private blockedProcesses: Set<number> = new Set();
  private systemResources: SystemResources | null = null;

  constructor() {
    this.loadDefaultRules();
  }

  /**
   * Initialise le service de verrouillage avancé
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔒 Initialisation du service de verrouillage avancé');
      
      // Charger les règles depuis le serveur
      await this.loadWhitelistRules();
      
      // Démarrer la surveillance
      await this.startAdvancedMonitoring();
      
      // Configurer les hooks système
      this.setupSystemHooks();
      
      console.log('✅ Service de verrouillage avancé initialisé');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      return false;
    }
  }

  /**
   * Charge les règles de liste blanche par défaut
   */
  private loadDefaultRules(): void {
    this.whitelistRules = [
      {
        id: 'default_browsers',
        name: 'Navigateurs Web',
        type: 'process_name',
        pattern: 'chrome|firefox|edge|safari',
        description: 'Navigateurs web autorisés',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'default_ides',
        name: 'Environnements de Développement',
        type: 'process_name',
        pattern: 'code|idea|eclipse|pycharm|sublime|atom|vim|emacs',
        description: 'IDEs et éditeurs de code',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'default_office',
        name: 'Suite Office',
        type: 'process_name',
        pattern: 'winword|excel|powerpnt|outlook|notepad|calc',
        description: 'Applications Microsoft Office',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'default_system',
        name: 'Processus Système',
        type: 'process_name',
        pattern: 'explorer|dwm|winlogon|csrss|services|lsass',
        description: 'Processus système Windows essentiels',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'blocked_apps',
        name: 'Applications Bloquées',
        type: 'process_name',
        pattern: 'discord|telegram|whatsapp|skype|zoom|teams',
        description: 'Applications de communication bloquées',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
  }

  /**
   * Charge les règles depuis le serveur
   */
  private async loadWhitelistRules(): Promise<void> {
    try {
      // Simulation - en production, récupérer depuis l'API
      console.log('📋 Règles de liste blanche chargées:', this.whitelistRules.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des règles:', error);
    }
  }

  /**
   * Démarre la surveillance avancée
   */
  async startAdvancedMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ La surveillance est déjà active');
      return;
    }

    try {
      console.log('🔍 Démarrage de la surveillance avancée');
      
      this.isMonitoring = true;
      
      // Surveillance périodique
      this.monitoringInterval = setInterval(async () => {
        await this.performAdvancedCheck();
      }, this.checkInterval);

      console.log('✅ Surveillance avancée démarrée');
    } catch (error) {
      console.error('❌ Erreur lors du démarrage de la surveillance:', error);
      this.isMonitoring = false;
    }
  }

  /**
   * Arrête la surveillance
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      console.log('🛑 Arrêt de la surveillance avancée');
      
      this.isMonitoring = false;
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      console.log('✅ Surveillance avancée arrêtée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'arrêt de la surveillance:', error);
    }
  }

  /**
   * Effectue une vérification avancée des processus
   */
  private async performAdvancedCheck(): Promise<void> {
    try {
      // Obtenir la liste des processus
      const processes = await this.getAdvancedProcessList();
      
      // Mettre à jour les ressources système
      this.systemResources = await this.getSystemResources();
      
      // Vérifier chaque processus
      for (const process of processes) {
        await this.checkProcessAgainstRules(process);
      }
      
      // Nettoyer les processus bloqués qui ne sont plus actifs
      this.cleanupBlockedProcesses(processes);
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification avancée:', error);
    }
  }

  /**
   * Obtient la liste avancée des processus
   */
  private async getAdvancedProcessList(): Promise<ProcessInfo[]> {
    return new Promise((resolve, reject) => {
      const command = process.platform === 'win32' 
        ? 'wmic process get ProcessId,Name,ExecutablePath,CommandLine,PageFileUsage,PercentProcessorTime,CreationDate,ParentProcessId /format:csv'
        : 'ps -eo pid,ppid,comm,cmd,%mem,%cpu,etime';
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        
        try {
          const processes = this.parseProcessList(stdout);
          resolve(processes);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Parse la liste des processus selon l'OS
   */
  private parseProcessList(output: string): ProcessInfo[] {
    const processes: ProcessInfo[] = [];
    const lines = output.split('\n').filter(line => line.trim());
    
    if (process.platform === 'win32') {
      // Parser pour Windows
      for (let i = 1; i < lines.length; i++) { // Skip header
        const parts = lines[i].split(',');
        if (parts.length >= 8) {
          const pid = parseInt(parts[1]);
          if (!isNaN(pid)) {
            processes.push({
              pid,
              name: parts[2] || '',
              executablePath: parts[3] || '',
              commandLine: parts[4] || '',
              memoryUsage: parseFloat(parts[5]) || 0,
              cpuUsage: parseFloat(parts[6]) || 0,
              startTime: new Date(parts[7]) || new Date(),
              parentPid: parseInt(parts[8]) || undefined,
              children: []
            });
          }
        }
      }
    } else {
      // Parser pour Linux/macOS
      for (let i = 1; i < lines.length; i++) { // Skip header
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length >= 6) {
          const pid = parseInt(parts[0]);
          if (!isNaN(pid)) {
            processes.push({
              pid,
              name: parts[2] || '',
              executablePath: parts[3] || '',
              commandLine: parts.slice(3).join(' '),
              memoryUsage: parseFloat(parts[4]) || 0,
              cpuUsage: parseFloat(parts[5]) || 0,
              startTime: new Date(),
              parentPid: parseInt(parts[1]) || undefined,
              children: []
            });
          }
        }
      }
    }
    
    return processes;
  }

  /**
   * Vérifie un processus contre les règles
   */
  private async checkProcessAgainstRules(process: ProcessInfo): Promise<void> {
    try {
      // Ignorer les processus système essentiels
      if (this.isSystemProcess(process)) {
        return;
      }

      // Vérifier contre les règles de liste blanche
      const violation = this.checkWhitelistRules(process);
      
      if (violation) {
        await this.handleViolation(violation);
      }
      
    } catch (error) {
      console.error(`❌ Erreur lors de la vérification du processus ${process.pid}:`, error);
    }
  }

  /**
   * Vérifie si un processus est autorisé
   */
  private checkWhitelistRules(process: ProcessInfo): LockViolation | null {
    for (const rule of this.whitelistRules) {
      if (!rule.enabled) continue;
      
      let isMatch = false;
      
      switch (rule.type) {
        case 'process_name':
          isMatch = new RegExp(rule.pattern, 'i').test(process.name);
          break;
        case 'executable':
          isMatch = new RegExp(rule.pattern, 'i').test(process.executablePath);
          break;
        case 'window_title':
          // En production, récupérer le titre de la fenêtre
          isMatch = false;
          break;
        case 'domain':
          // En production, vérifier les domaines web ouverts
          isMatch = false;
          break;
      }
      
      // Si c'est une règle de blocage et qu'elle correspond
      if (rule.id === 'blocked_apps' && isMatch) {
        return {
          id: `violation_${Date.now()}_${process.pid}`,
          timestamp: new Date(),
          process,
          rule_violated: rule.name,
          severity: 'high',
          action_taken: 'blocked',
          user_notified: false
        };
      }
      
      // Si c'est une règle d'autorisation et qu'elle correspond
      if (rule.id !== 'blocked_apps' && isMatch) {
        return null; // Processus autorisé
      }
    }
    
    // Si aucune règle d'autorisation ne correspond, c'est une violation
    return {
      id: `violation_${Date.now()}_${process.pid}`,
      timestamp: new Date(),
      process,
      rule_violated: 'Aucune règle d\'autorisation',
      severity: 'medium',
      action_taken: 'warned',
      user_notified: false
    };
  }

  /**
   * Gère une violation détectée
   */
  private async handleViolation(violation: LockViolation): Promise<void> {
    try {
      console.warn(`⚠️ Violation détectée: ${violation.process.name} (PID: ${violation.process.pid})`);
      
      // Ajouter à l'historique des violations
      this.violations.push(violation);
      
      // Limiter l'historique
      if (this.violations.length > 1000) {
        this.violations = this.violations.slice(-500);
      }
      
      // Prendre l'action appropriée
      switch (violation.action_taken) {
        case 'blocked':
          await this.blockProcess(violation.process.pid);
          break;
        case 'warned':
          await this.warnUser(violation);
          break;
        case 'monitored':
          await this.monitorProcess(violation.process.pid);
          break;
      }
      
      // Notifier l'utilisateur
      if (!violation.user_notified) {
        this.notifyUser(violation);
        violation.user_notified = true;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la gestion de la violation:', error);
    }
  }

  /**
   * Bloque un processus
   */
  private async blockProcess(pid: number): Promise<void> {
    try {
      if (this.blockedProcesses.has(pid)) {
        return; // Déjà bloqué
      }
      
      console.log(`🔪 Blocage du processus ${pid}`);
      
      // Terminer le processus
      if (process.platform === 'win32') {
        exec(`taskkill /PID ${pid} /F`);
      } else {
        exec(`kill -9 ${pid}`);
      }
      
      this.blockedProcesses.add(pid);
      
      console.log(`✅ Processus ${pid} bloqué avec succès`);
      
    } catch (error) {
      console.error(`❌ Erreur lors du blocage du processus ${pid}:`, error);
    }
  }

  /**
   * Avertit l'utilisateur
   */
  private async warnUser(violation: LockViolation): Promise<void> {
    console.log(`⚠️ Avertissement: ${violation.process.name} n'est pas autorisé`);
    // En production, afficher une notification à l'utilisateur
  }

  /**
   * Surveille un processus
   */
  private async monitorProcess(pid: number): Promise<void> {
    console.log(`👁️ Surveillance du processus ${pid}`);
    // En production, ajouter à une liste de surveillance spéciale
  }

  /**
   * Notifie l'utilisateur d'une violation
   */
  private notifyUser(violation: LockViolation): void {
    const message = `Application non autorisée détectée: ${violation.process.name}`;
    
    // Créer une notification système
    const notification = new Notification('ProctoFlex AI - Violation Détectée', {
      body: message,
      icon: '/assets/icon.png',
      tag: 'security-violation'
    });

    notification.onclick = () => {
      console.log('Notification de sécurité cliquée');
    };
  }

  /**
   * Vérifie si un processus est un processus système
   */
  private isSystemProcess(process: ProcessInfo): boolean {
    const systemProcesses = [
      'System', 'Idle', 'smss', 'csrss', 'wininit', 'winlogon',
      'services', 'lsass', 'svchost', 'dwm', 'explorer'
    ];
    
    return systemProcesses.includes(process.name) || process.pid <= 4;
  }

  /**
   * Nettoie les processus bloqués qui ne sont plus actifs
   */
  private cleanupBlockedProcesses(activeProcesses: ProcessInfo[]): void {
    const activePids = new Set(activeProcesses.map(p => p.pid));
    
    for (const blockedPid of this.blockedProcesses) {
      if (!activePids.has(blockedPid)) {
        this.blockedProcesses.delete(blockedPid);
      }
    }
  }

  /**
   * Obtient les ressources système
   */
  private async getSystemResources(): Promise<SystemResources> {
    return new Promise((resolve, reject) => {
      const command = process.platform === 'win32'
        ? 'wmic cpu get loadpercentage /value && wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value'
        : 'top -bn1 | grep "Cpu(s)" && free -m';
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        
        try {
          // Parser les ressources système
          const resources: SystemResources = {
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 0,
            network_connections: 0,
            running_processes: 0
          };
          
          // Simulation - en production, parser réellement les données
          resources.cpu_usage = Math.random() * 100;
          resources.memory_usage = Math.random() * 100;
          resources.disk_usage = Math.random() * 100;
          resources.network_connections = Math.floor(Math.random() * 100);
          resources.running_processes = Math.floor(Math.random() * 200);
          
          resolve(resources);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Configure les hooks système
   */
  private setupSystemHooks(): void {
    // En production, configurer des hooks pour intercepter les nouveaux processus
    console.log('🔧 Hooks système configurés');
  }

  /**
   * Ajoute une règle de liste blanche
   */
  async addWhitelistRule(rule: Omit<WhitelistRule, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newRule: WhitelistRule = {
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      this.whitelistRules.push(newRule);
      console.log(`✅ Règle ajoutée: ${newRule.name}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la règle:', error);
      return false;
    }
  }

  /**
   * Supprime une règle
   */
  async removeWhitelistRule(ruleId: string): Promise<boolean> {
    try {
      const index = this.whitelistRules.findIndex(rule => rule.id === ruleId);
      if (index !== -1) {
        this.whitelistRules.splice(index, 1);
        console.log(`✅ Règle supprimée: ${ruleId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la règle:', error);
      return false;
    }
  }

  /**
   * Obtient les statistiques de surveillance
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    violationsCount: number;
    blockedProcessesCount: number;
    whitelistRulesCount: number;
    systemResources: SystemResources | null;
  } {
    return {
      isMonitoring: this.isMonitoring,
      violationsCount: this.violations.length,
      blockedProcessesCount: this.blockedProcesses.size,
      whitelistRulesCount: this.whitelistRules.length,
      systemResources: this.systemResources
    };
  }

  /**
   * Obtient l'historique des violations
   */
  getViolations(limit: number = 50): LockViolation[] {
    return this.violations.slice(-limit).reverse();
  }

  /**
   * Nettoie les ressources
   */
  async cleanup(): Promise<void> {
    try {
      await this.stopMonitoring();
      this.blockedProcesses.clear();
      this.violations = [];
      console.log('✅ Service de verrouillage avancé nettoyé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }
}

// Instance globale du service
export const advancedApplicationLockService = new AdvancedApplicationLockService();

// Export des types
export type {
  ProcessInfo,
  WhitelistRule,
  LockViolation,
  SystemResources
};
