import type { IncidentStatus, IncidentType, Severity } from "../types/domain";

export const incidentTypeLabel: Record<IncidentType, string> = {
  POTENTIAL_DROWNING: "Утопление",
  SAFE_ZONE_VIOLATION: "Заплыв за границу",
  RESTRICTED_ZONE: "Запрещенная зона",
  PERSON_OVERBOARD: "Человек за бортом",
  CHILD_RISK: "Дети",
  FISHERMAN_SAFETY: "Рыбаки",
  SEARCH_TARGET: "Поисковая цель"
};

export const incidentStatusLabel: Record<IncidentStatus, string> = {
  NEW: "Новый",
  CONFIRMED: "Подтвержден",
  DISPATCHED: "Спасатель направлен",
  RESCUER_ACCEPTED: "Принят спасателем",
  ARRIVED: "На месте",
  RESOLVED: "Закрыт",
  FALSE_ALARM: "Ложная тревога"
};

export const severityLabel: Record<Severity, string> = {
  LOW: "низкая",
  MEDIUM: "средняя",
  HIGH: "высокая",
  CRITICAL: "критическая"
};
