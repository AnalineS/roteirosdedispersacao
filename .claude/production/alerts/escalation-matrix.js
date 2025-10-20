/**
 * Matriz de Escalação para Equipe Médica
 * Plataforma Educacional de Hanseníase
 * Escalação inteligente baseada em prioridade médica e horários
 */

export class MedicalEscalationMatrix {
    constructor() {
        this.escalationRules = new Map();
        this.medicalTeam = new Map();
        this.schedules = new Map();
        this.onCallRotation = [];
        
        this.config = {
            // Níveis de escalação médica
            escalationLevels: {
                L1: {
                    name: 'Suporte Técnico',
                    responseTime: 300, // 5 minutos
                    roles: ['tech_support', 'system_admin']
                },
                L2: {
                    name: 'Equipe Médica',
                    responseTime: 900, // 15 minutos
                    roles: ['medical_supervisor', 'clinical_coordinator']
                },
                L3: {
                    name: 'Direção Médica',
                    responseTime: 1800, // 30 minutos
                    roles: ['medical_director', 'compliance_officer']
                },
                L4: {
                    name: 'Emergência Executiva',
                    responseTime: 3600, // 1 hora
                    roles: ['ceo', 'cto', 'legal_counsel']
                }
            },
            
            // Regras de escalação por tipo de alerta
            alertEscalationRules: {
                PATIENT_DATA_BREACH: ['L3', 'L4'], // Direto para direção
                MEDICAL_CALCULATION_ERROR: ['L2', 'L3'],
                PROTOCOL_UNAVAILABLE: ['L1', 'L2'],
                LGPD_COMPLIANCE_VIOLATION: ['L3', 'L4'],
                SYSTEM_DOWN: ['L1', 'L2', 'L3'],
                GASNELIO_PERSONA_DOWN: ['L1', 'L2'],
                SECURITY_INCIDENT: ['L2', 'L3', 'L4'],
                SLA_BREACH: ['L1', 'L2']
            },
            
            // Horários críticos médicos
            criticalHours: {
                weekdays: { start: 8, end: 18 }, // 8h às 18h
                weekends: { start: 9, end: 17 }  // 9h às 17h
            },
            
            // Configuração de plantão
            onCallConfig: {
                rotationDays: 7, // Rodízio semanal
                emergencyOnly: false,
                weekendCoverage: true,
                holidayCoverage: true
            }
        };
        
        this.initializeTeam();
        this.setupEscalationRules();
    }

    /**
     * Inicializar equipe médica
     */
    initializeTeam() {
        // Configuração da equipe médica (exemplo)
        const teamMembers = [
            {
                id: 'dr_silva',
                name: 'Dr. João Silva',
                role: 'medical_director',
                level: 'L3',
                contacts: {
                    email: 'joao.silva@hanseniase.edu.br',
                    phone: '+5511999999999',
                    slack: '@dr.silva'
                },
                schedule: 'business_hours',
                expertise: ['hanseniase', 'compliance', 'protocols']
            },
            {
                id: 'coord_maria',
                name: 'Maria Coordenadora',
                role: 'clinical_coordinator',
                level: 'L2',
                contacts: {
                    email: 'maria.coord@hanseniase.edu.br',
                    phone: '+5511888888888',
                    slack: '@maria.coord'
                },
                schedule: 'extended_hours',
                expertise: ['clinical_operations', 'patient_care']
            },
            {
                id: 'tech_carlos',
                name: 'Carlos Técnico',
                role: 'system_admin',
                level: 'L1',
                contacts: {
                    email: 'carlos.tech@hanseniase.edu.br',
                    phone: '+5511777777777',
                    slack: '@carlos.tech'
                },
                schedule: '24x7',
                expertise: ['systems', 'monitoring', 'infrastructure']
            },
            {
                id: 'compliance_ana',
                name: 'Ana Compliance',
                role: 'compliance_officer',
                level: 'L3',
                contacts: {
                    email: 'ana.compliance@hanseniase.edu.br',
                    phone: '+5511666666666',
                    slack: '@ana.compliance'
                },
                schedule: 'business_hours',
                expertise: ['lgpd', 'audit', 'regulatory']
            }
        ];
        
        teamMembers.forEach(member => {
            this.medicalTeam.set(member.id, member);
        });
        
        console.log(`👥 [TEAM] ${teamMembers.length} membros da equipe médica carregados`);
    }

    /**
     * Configurar regras de escalação
     */
    setupEscalationRules() {
        for (const [alertType, levels] of Object.entries(this.config.alertEscalationRules)) {
            this.escalationRules.set(alertType, {
                levels,
                currentLevel: 0,
                maxLevels: levels.length
            });
        }
        
        console.log('📋 [ESCALATION] Regras de escalação configuradas');
    }

    /**
     * Determinar escalação para alerta específico
     */
    determineEscalation(alertType, priority, timestamp = Date.now()) {
        const escalationRule = this.escalationRules.get(alertType);
        
        if (!escalationRule) {
            // Escalação padrão baseada na prioridade
            return this.getDefaultEscalation(priority);
        }
        
        const escalationPlan = {
            alertType,
            priority,
            timestamp: new Date(timestamp).toISOString(),
            levels: [],
            totalLevels: escalationRule.levels.length,
            estimatedResolutionTime: this.estimateResolutionTime(escalationRule.levels)
        };
        
        // Construir plano de escalação
        for (let i = 0; i < escalationRule.levels.length; i++) {
            const levelName = escalationRule.levels[i];
            const levelConfig = this.config.escalationLevels[levelName];
            const responsibleTeam = this.getResponsibleTeam(levelName, timestamp);
            
            escalationPlan.levels.push({
                level: i + 1,
                name: levelName,
                description: levelConfig.name,
                responseTime: levelConfig.responseTime,
                team: responsibleTeam,
                escalationTime: timestamp + (i * levelConfig.responseTime * 1000),
                escalationTimeFormatted: new Date(timestamp + (i * levelConfig.responseTime * 1000)).toISOString()
            });
        }
        
        return escalationPlan;
    }

    /**
     * Obter equipe responsável por nível
     */
    getResponsibleTeam(levelName, timestamp) {
        const levelConfig = this.config.escalationLevels[levelName];
        const team = [];
        
        for (const [memberId, member] of this.medicalTeam) {
            if (levelConfig.roles.includes(member.role)) {
                // Verificar disponibilidade
                const isAvailable = this.isTeamMemberAvailable(member, timestamp);
                
                team.push({
                    id: memberId,
                    name: member.name,
                    role: member.role,
                    contacts: member.contacts,
                    available: isAvailable,
                    onCall: this.isOnCall(memberId, timestamp),
                    expertise: member.expertise
                });
            }
        }
        
        // Ordenar por disponibilidade e expertise
        return team.sort((a, b) => {
            if (a.onCall && !b.onCall) return -1;
            if (!a.onCall && b.onCall) return 1;
            if (a.available && !b.available) return -1;
            if (!a.available && b.available) return 1;
            return 0;
        });
    }

    /**
     * Verificar disponibilidade do membro da equipe
     */
    isTeamMemberAvailable(member, timestamp) {
        const date = new Date(timestamp);
        const hour = date.getHours();
        const day = date.getDay(); // 0 = domingo, 6 = sábado
        
        switch (member.schedule) {
            case '24x7':
                return true;
                
            case 'business_hours':
                if (day >= 1 && day <= 5) { // Segunda a sexta
                    return hour >= this.config.criticalHours.weekdays.start && 
                           hour < this.config.criticalHours.weekdays.end;
                }
                return false;
                
            case 'extended_hours':
                if (day >= 1 && day <= 5) { // Segunda a sexta
                    return hour >= 7 && hour < 20; // 7h às 20h
                } else if (day === 6 || day === 0) { // Fim de semana
                    return hour >= this.config.criticalHours.weekends.start && 
                           hour < this.config.criticalHours.weekends.end;
                }
                return false;
                
            default:
                return false;
        }
    }

    /**
     * Verificar se membro está de plantão
     */
    isOnCall(memberId, timestamp) {
        // Lógica simplificada - em produção seria mais robusta
        const date = new Date(timestamp);
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const rotationWeek = Math.floor(dayOfYear / this.config.onCallConfig.rotationDays);
        
        // Distribuição de plantão baseada no ID do membro
        const memberIndex = Array.from(this.medicalTeam.keys()).indexOf(memberId);
        return (rotationWeek % this.medicalTeam.size) === memberIndex;
    }

    /**
     * Executar escalação para alerta
     */
    async executeEscalation(alert, level = 1) {
        const escalationPlan = this.determineEscalation(alert.type, alert.priority);
        
        if (!escalationPlan.levels[level - 1]) {
            throw new Error(`Nível de escalação ${level} não existe para ${alert.type}`);
        }
        
        const currentLevel = escalationPlan.levels[level - 1];
        const notifications = [];
        
        console.log(`📈 [ESCALATION] Escalando ${alert.id} para ${currentLevel.name} (L${level})`);
        
        // Notificar equipe responsável
        for (const member of currentLevel.team) {
            if (member.available || member.onCall || alert.priority === 'CRITICAL') {
                try {
                    const notification = await this.notifyTeamMember(member, alert, currentLevel);
                    notifications.push(notification);
                } catch (error) {
                    console.error(`❌ [ESCALATION] Falha ao notificar ${member.name}:`, error.message);
                }
            }
        }
        
        // Agendar próxima escalação se necessário
        if (level < escalationPlan.totalLevels) {
            const nextEscalationTime = currentLevel.escalationTime + (currentLevel.responseTime * 1000);
            
            setTimeout(async () => {
                if (!alert.resolved && !alert.acknowledged.length) {
                    await this.executeEscalation(alert, level + 1);
                }
            }, currentLevel.responseTime * 1000);
        }
        
        return {
            level,
            levelName: currentLevel.name,
            notificationsSent: notifications.length,
            teamNotified: currentLevel.team.length,
            nextEscalationTime: level < escalationPlan.totalLevels ? 
                new Date(currentLevel.escalationTime + (currentLevel.responseTime * 1000)).toISOString() : null
        };
    }

    /**
     * Notificar membro da equipe
     */
    async notifyTeamMember(member, alert, level) {
        const notification = {
            memberId: member.id,
            memberName: member.name,
            alert: {
                id: alert.id,
                type: alert.type,
                priority: alert.priority
            },
            level: level.name,
            timestamp: new Date().toISOString(),
            channels: []
        };
        
        // Determinar canais de notificação baseado na prioridade
        const channels = this.getNotificationChannels(alert.priority, member);
        
        for (const channel of channels) {
            try {
                await this.sendMemberNotification(channel, member, alert, level);
                notification.channels.push({ channel, status: 'sent' });
            } catch (error) {
                notification.channels.push({ 
                    channel, 
                    status: 'failed', 
                    error: error.message 
                });
            }
        }
        
        console.log(`📨 [NOTIFY] ${member.name} notificado sobre ${alert.id} via ${channels.join(', ')}`);
        
        return notification;
    }

    /**
     * Obter canais de notificação para membro
     */
    getNotificationChannels(priority, member) {
        const channels = [];
        
        // Email sempre incluído
        if (member.contacts.email) {
            channels.push('email');
        }
        
        // Slack para prioridades médias e altas
        if (member.contacts.slack && (priority === 'HIGH' || priority === 'CRITICAL')) {
            channels.push('slack');
        }
        
        // SMS/Phone para críticos
        if (priority === 'CRITICAL' && member.contacts.phone) {
            channels.push('sms');
        }
        
        return channels;
    }

    /**
     * Obter escalação padrão baseada na prioridade
     */
    getDefaultEscalation(priority) {
        const defaultRules = {
            CRITICAL: ['L2', 'L3', 'L4'],
            HIGH: ['L1', 'L2', 'L3'],
            MEDIUM: ['L1', 'L2'],
            LOW: ['L1']
        };
        
        return {
            levels: defaultRules[priority] || defaultRules.LOW,
            currentLevel: 0,
            maxLevels: (defaultRules[priority] || defaultRules.LOW).length
        };
    }

    /**
     * Estimar tempo de resolução
     */
    estimateResolutionTime(levels) {
        let totalTime = 0;
        
        for (const levelName of levels) {
            const levelConfig = this.config.escalationLevels[levelName];
            totalTime += levelConfig.responseTime;
        }
        
        return totalTime;
    }

    /**
     * Gerar relatório de escalação
     */
    generateEscalationReport(timeRange = '24h') {
        // Implementação de relatório de escalação
        return {
            timeRange,
            escalationsExecuted: 0,
            averageResponseTime: 0,
            teamPerformance: {},
            recommendations: []
        };
    }

    // Métodos stub para implementações específicas
    async sendMemberNotification(channel, member, alert, level) {
        console.log(`📨 [${channel.toUpperCase()}] Enviando para ${member.name}: ${alert.type}`);
        // Implementação específica do canal
    }
}

export default MedicalEscalationMatrix;