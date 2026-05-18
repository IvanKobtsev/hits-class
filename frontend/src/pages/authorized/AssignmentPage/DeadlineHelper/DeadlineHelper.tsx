import React, { useEffect, useState } from 'react';
import type { DeadlineCriteria } from 'services/api/api-client.types';
import { BonusType } from 'services/api/api-client.types';
import styles from './DeadlineHelper.module.scss';

interface Props {
  deadlineUtc: Date | null;
  deadlineCriteria: DeadlineCriteria | null;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatBonus(bonusValue: number, bonusType: BonusType): string {
  if (bonusType === BonusType.Score) return `+${bonusValue} балл(ов)`;
  return `коэффициент ×${bonusValue}`;
}

interface Point {
  time: Date;
  type: 'earlyBonus' | 'deadline' | 'latePenalty';
  label: string;
  tooltipTitle: string;
  tooltipBody: string;
}

export const DeadlineHelper: React.FC<Props> = ({ deadlineUtc, deadlineCriteria }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!deadlineUtc && !deadlineCriteria) return null;

  const points: Point[] = [];

  if (deadlineCriteria?.earlyBonus) {
    const { earliestDate, bonusValue, bonusType } = deadlineCriteria.earlyBonus;
    const d = new Date(earliestDate);
    points.push({
      time: d,
      type: 'earlyBonus',
      label: 'Бонус',
      tooltipTitle: 'Ранний бонус',
      tooltipBody: `Сдайте работу до ${formatDateTime(d)} и получите ${formatBonus(bonusValue, bonusType)}`,
    });
  }

  if (deadlineUtc) {
    const d = new Date(deadlineUtc);
    points.push({
      time: d,
      type: 'deadline',
      label: 'Дедлайн',
      tooltipTitle: 'Срок сдачи',
      tooltipBody: formatDateTime(d),
    });
  }

  if (deadlineCriteria?.latePenalty) {
    const d = new Date(deadlineCriteria.latePenalty.latestDate);
    points.push({
      time: d,
      type: 'latePenalty',
      label: 'Штраф',
      tooltipTitle: 'Штраф за опоздание',
      tooltipBody: `Работы сданные после ${formatDateTime(d)} будут оштрафованы`,
    });
  }

  if (points.length === 0) return null;

  const allMs = [...points.map((p) => p.time.getTime()), now.getTime()];
  const minMs = Math.min(...allMs);
  const maxMs = Math.max(...allMs);
  const range = maxMs - minMs;
  const padding = Math.max(range * 0.18, 60 * 60 * 1000); // at least 1 h padding
  const start = minMs - padding;
  const end = maxMs + padding;
  const total = end - start;

  const pct = (ms: number) => ((ms - start) / total) * 100;
  const nowPct = pct(now.getTime());

  return (
    <div className={styles.container}>
      <div className={styles.title}>Временная шкала</div>
      <div className={styles.trackWrapper}>
        <div className={styles.track} />

        {points.map((point) => {
          const left = pct(point.time.getTime());
          const flipTooltip = left > 65;
          return (
            <div
              key={point.type}
              className={`${styles.point} ${styles[point.type]}`}
              style={{ left: `${left}%` }}
            >
              <div className={`${styles.tooltip} ${flipTooltip ? styles.tooltipRight : ''}`}>
                <span className={styles.tooltipTitle}>{point.tooltipTitle}</span>
                <span className={styles.tooltipBody}>{point.tooltipBody}</span>
              </div>
              <span className={styles.pointLabel}>{point.label}</span>
            </div>
          );
        })}

        <div className={styles.nowLine} style={{ left: `${nowPct}%` }}>
          <span className={styles.nowLabel}>Сейчас</span>
        </div>
      </div>
    </div>
  );
};
