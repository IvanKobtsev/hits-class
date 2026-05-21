import {CreateCriteriaDto, CriteriaType} from 'services/api/api-client.types';
import {Input} from 'components/uikit/inputs/Input';
import {Button, ButtonColor} from 'components/uikit/buttons/Button';
import {RadioButton} from 'components/uikit/RadioButton';
import {Field} from 'components/uikit/Field';
import styles from './CriteriaFields.module.scss';
import {CheckBox} from "../../../../components/uikit/CheckBox.tsx";

export type CriteriaItem = CreateCriteriaDto & { _key: string };

export function makeCriteriaKey(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type Props = {
  value: CriteriaItem[];
  onChange: (items: CriteriaItem[]) => void;
};

export const CriteriaFields = ({ value, onChange }: Props) => {
  const handleAdd = () => {
    onChange([
      ...value,
      { _key: makeCriteriaKey(), description: '', type: CriteriaType.Requirement, minValue: null, maxValue: null },
    ]);
  };

  const update = (key: string, patch: Partial<CreateCriteriaDto>) => {
    onChange(value.map(item => item._key === key ? { ...item, ...patch } : item));
  };

  const remove = (key: string) => {
    onChange(value.filter(item => item._key !== key));
  };

  const isBonus = (type: CriteriaType): boolean => {
    return type === CriteriaType.BonusMultiplier || type === CriteriaType.BonusScore;
  }

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
      {value.map(item => (
        <div key={item._key} className={styles.item}>
          <div className={styles.itemHeader}>
            <Input
              value={item.description}
              onChange={e => update(item._key, { description: e.target.value })}
              placeholder="Описание критерия"
              className={styles.descriptionInput}
            />
            <button type="button" className={styles.removeBtn} onClick={() => remove(item._key)}>
              ✕
            </button>
          </div>
          <div className={styles.typeRow}>
            <RadioButton
              name={`criteria-type-${item._key}`}
              value={CriteriaType.Requirement}
              checked={item.type === CriteriaType.Requirement}
              onChange={() => update(item._key, { type: CriteriaType.Requirement, minValue: null, maxValue: null })}
              title="Требование"
            />
            <RadioButton
              name={`criteria-type-${item._key}`}
              value={CriteriaType.Score}
              checked={item.type === CriteriaType.Score || item.type === CriteriaType.BonusScore}
              onChange={() => update(item._key, { type: isBonus(item.type) ? CriteriaType.BonusScore : CriteriaType.Score })}
              title="Баллы"
            />
            <RadioButton
              name={`criteria-type-${item._key}`}
              value={CriteriaType.Multiplier}
              checked={item.type === CriteriaType.Multiplier || item.type === CriteriaType.BonusMultiplier}
              onChange={() => update(item._key, { type: isBonus(item.type) ? CriteriaType.BonusMultiplier : CriteriaType.Multiplier })}
              title="Коэффициент"
            />
          </div>
          {item.type !== CriteriaType.Requirement && (
            <div className={styles.valuesRow}>
              <Field title="Мин. оценка">
                <Input
                  type="number"
                  value={item.minValue ?? ''}
                  onChange={e => update(item._key, { minValue: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="0"
                />
              </Field>
              <Field title="Макс. оценка">
                <Input
                  type="number"
                  value={item.maxValue ?? ''}
                  onChange={e => update(item._key, { maxValue: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="10"
                />
              </Field>
              <CheckBox title={"Бонус"} name={"bonus" + item._key} className={styles.checkbox} defaultChecked={item.type === CriteriaType.BonusMultiplier || item.type === CriteriaType.BonusScore}
                        onClick={() =>
                          update(item._key, { type:
                              (item.type === CriteriaType.BonusMultiplier ?
                                CriteriaType.Multiplier :
                                item.type === CriteriaType.BonusScore ?
                                  CriteriaType.Score :
                                  item.type === CriteriaType.Multiplier ?
                                    CriteriaType.BonusMultiplier :
                                    CriteriaType.BonusScore) })}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
