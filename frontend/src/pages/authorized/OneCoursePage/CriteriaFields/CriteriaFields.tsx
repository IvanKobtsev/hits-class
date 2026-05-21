import { BonusType, CreateCriteriaDto, CriteriaType } from 'services/api/api-client.types';
import { Input } from 'components/uikit/inputs/Input';
import { Button, ButtonColor } from 'components/uikit/buttons/Button';
import { RadioButton } from 'components/uikit/RadioButton';
import { Field } from 'components/uikit/Field';
import { DefaultTooltip } from 'components/uikit/tooltips/Tooltip';
import styles from './CriteriaFields.module.scss';
import { CheckBox } from '../../../../components/uikit/CheckBox.tsx';

export type CriteriaItem = CreateCriteriaDto & { _key: string };

export function makeCriteriaKey(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type EarlyBonusInfo = { bonusValue: number; bonusType: BonusType };

type Props = {
  value: CriteriaItem[];
  onChange: (items: CriteriaItem[]) => void;
  earlyBonus?: EarlyBonusInfo | null;
};

export const CriteriaFields = ({ value, onChange, earlyBonus }: Props) => {
  const handleAdd = () => {
    onChange([
      ...value,
      {
        _key: makeCriteriaKey(),
        description: '',
        type: CriteriaType.Requirement,
        minValue: null,
        maxValue: null,
      },
    ]);
  };

  const update = (key: string, patch: Partial<CreateCriteriaDto>) => {
    onChange(
      value.map((item) => (item._key === key ? { ...item, ...patch } : item)),
    );
  };

  const remove = (key: string) => {
    onChange(value.filter((item) => item._key !== key));
  };

  const isBonus = (type: CriteriaType): boolean => {
    return (
      type === CriteriaType.BonusMultiplier || type === CriteriaType.BonusScore
    );
  };

  // ── Max-score summary ────────────────────────────────────────────────────────
  // Correct formula:
  //   baseScore × baseMultiplier + bonusScore × bonusMultiplier [± earlyBonus]
  // Regular multipliers only affect base scores; bonus multipliers only affect bonus scores.
  const baseScoreItems = value.filter((c) => c.type === CriteriaType.Score);
  const bonusScoreItems = value.filter((c) => c.type === CriteriaType.BonusScore);
  const baseMultItems = value.filter((c) => c.type === CriteriaType.Multiplier);
  const bonusMultItems = value.filter((c) => c.type === CriteriaType.BonusMultiplier);

  const maxScoreInfo = (() => {
    if (baseScoreItems.length === 0 && bonusScoreItems.length === 0) return null;

    const nameOf = (c: CriteriaItem, i: number, prefix: string) =>
      c.description.trim() || `${prefix} ${i + 1}`;

    // Numeric totals
    const baseScoreTotal = baseScoreItems.reduce((s, c) => s + (c.maxValue ?? 0), 0);
    const bonusScoreTotal = bonusScoreItems.reduce((s, c) => s + (c.maxValue ?? 0), 0);
    const baseMultTotal =
      baseMultItems.length > 0
        ? baseMultItems.reduce((s, c) => s + (c.maxValue ?? 0), 0)
        : 1;
    const bonusMultTotal =
      bonusMultItems.length > 0
        ? bonusMultItems.reduce((s, c) => s + (c.maxValue ?? 0), 0)
        : 1;

    let maxScore = baseScoreTotal * baseMultTotal + bonusScoreTotal * bonusMultTotal;
    if (earlyBonus) {
      if (earlyBonus.bonusType === BonusType.Score) {
        maxScore += earlyBonus.bonusValue;
      } else {
        maxScore *= earlyBonus.bonusValue;
      }
    }
    maxScore = parseFloat(maxScore.toFixed(10));

    // Build one formula segment: "(s1 + s2) × m1" or "s1" etc.
    const buildSegment = (
      scoreItems: CriteriaItem[],
      multItems: CriteriaItem[],
      scorePrefix: string,
      multPrefix: string,
      useValues: boolean,
    ): string | null => {
      if (scoreItems.length === 0) return null;
      const scoreTerms = useValues
        ? scoreItems.map((c) => String(c.maxValue ?? 0))
        : scoreItems.map((c, i) => nameOf(c, i, scorePrefix));
      const scoreStr =
        scoreTerms.length > 1 ? `(${scoreTerms.join(' + ')})` : scoreTerms[0];
      if (multItems.length === 0) return scoreStr;
      const multTerms = useValues
        ? multItems.map((c) => String(c.maxValue ?? 0))
        : multItems.map((c, i) => nameOf(c, i, multPrefix));
      const multStr =
        multTerms.length > 1 ? `(${multTerms.join(' + ')})` : multTerms[0];
      return `${scoreStr} × ${multStr}`;
    };

    const buildFormula = (useValues: boolean): string => {
      const basePart = buildSegment(
        baseScoreItems, baseMultItems, 'Критерий', 'Коэффициент', useValues,
      );
      const bonusPart = buildSegment(
        bonusScoreItems, bonusMultItems, 'Бонус.крит.', 'Бонус.коэф.', useValues,
      );
      const parts = [basePart, bonusPart].filter(Boolean) as string[];
      let main = parts.join(' + ');

      if (earlyBonus) {
        const bv = String(earlyBonus.bonusValue);
        if (earlyBonus.bonusType === BonusType.Score) {
          main = `${main} + ${bv}`;
        } else {
          main = (parts.length > 1 ? `(${main})` : main) + ` × ${bv}`;
        }
      }
      return main;
    };

    const wordFormula = buildFormula(false);
    const numFormula = `${buildFormula(true)} = ${maxScore}`;

    return { wordFormula, numFormula, maxScore };
  })();

  const bonusTooltip = (type: CriteriaType): string => {
    switch (type) {
      case CriteriaType.Multiplier:
        return 'Умножает сырой балл';
      case CriteriaType.BonusMultiplier:
        return 'Умножает бонусный балл';
      case CriteriaType.Score:
        return 'Сырой балл';
      case CriteriaType.BonusScore:
        return 'Бонусный балл';
      default:
        return '';
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Критерии оценивания</span>
        <Button
          title="+ Добавить"
          color={ButtonColor.Default}
          onClick={handleAdd}
        />
      </div>
      {maxScoreInfo && (
        <DefaultTooltip
          title={
            <div>
              <div>{maxScoreInfo.wordFormula}</div>
              <div>{maxScoreInfo.numFormula}</div>
            </div>
          }
          placement="top"
          enterDelay={200}
        >
          <div className={styles.maxScore}>
            Максимальный балл: <strong>{maxScoreInfo.maxScore}</strong>
          </div>
        </DefaultTooltip>
      )}
      {value.map((item) => (
        <div key={item._key} className={styles.item}>
          <div className={styles.itemHeader}>
            <Input
              value={item.description}
              onChange={(e) =>
                update(item._key, { description: e.target.value })
              }
              placeholder="Описание критерия"
              className={styles.descriptionInput}
            />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => remove(item._key)}
            >
              ✕
            </button>
          </div>
          <div className={styles.typeRow}>
            <RadioButton
              name={`criteria-type-${item._key}`}
              value={CriteriaType.Requirement}
              checked={item.type === CriteriaType.Requirement}
              onChange={() =>
                update(item._key, {
                  type: CriteriaType.Requirement,
                  minValue: null,
                  maxValue: null,
                })
              }
              title="Требование"
            />
            <RadioButton
              name={`criteria-type-${item._key}`}
              value={CriteriaType.Score}
              checked={
                item.type === CriteriaType.Score ||
                item.type === CriteriaType.BonusScore
              }
              onChange={() =>
                update(item._key, {
                  type: isBonus(item.type)
                    ? CriteriaType.BonusScore
                    : CriteriaType.Score,
                })
              }
              title="Баллы"
            />
            <RadioButton
              name={`criteria-type-${item._key}`}
              value={CriteriaType.Multiplier}
              checked={
                item.type === CriteriaType.Multiplier ||
                item.type === CriteriaType.BonusMultiplier
              }
              onChange={() =>
                update(item._key, {
                  type: isBonus(item.type)
                    ? CriteriaType.BonusMultiplier
                    : CriteriaType.Multiplier,
                })
              }
              title="Коэффициент"
            />
          </div>
          {item.type !== CriteriaType.Requirement && (
            <div className={styles.valuesRow}>
              <Field title="Мин. оценка">
                <Input
                  type="number"
                  value={item.minValue ?? ''}
                  onChange={(e) =>
                    update(item._key, {
                      minValue:
                        e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </Field>
              <Field title="Макс. оценка">
                <Input
                  type="number"
                  value={item.maxValue ?? ''}
                  onChange={(e) =>
                    update(item._key, {
                      maxValue:
                        e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  placeholder="10"
                />
              </Field>
              <DefaultTooltip
                title={bonusTooltip(item.type)}
                placement="top"
                enterDelay={300}
              >
                <span>
                  <CheckBox
                    title={'Бонус'}
                    name={'bonus' + item._key}
                    className={styles.checkbox}
                    defaultChecked={
                      item.type === CriteriaType.BonusMultiplier ||
                      item.type === CriteriaType.BonusScore
                    }
                    onClick={() =>
                      update(item._key, {
                        type:
                          item.type === CriteriaType.BonusMultiplier
                            ? CriteriaType.Multiplier
                            : item.type === CriteriaType.BonusScore
                              ? CriteriaType.Score
                              : item.type === CriteriaType.Multiplier
                                ? CriteriaType.BonusMultiplier
                                : CriteriaType.BonusScore,
                      })
                    }
                  />
                </span>
              </DefaultTooltip>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
