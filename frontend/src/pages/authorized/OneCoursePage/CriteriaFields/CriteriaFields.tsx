import { CreateCriteriaDto, CriteriaType } from 'services/api/api-client.types';
import { Input } from 'components/uikit/inputs/Input';
import { Button, ButtonColor } from 'components/uikit/buttons/Button';
import { RadioButton } from 'components/uikit/RadioButton';
import { Field } from 'components/uikit/Field';
import styles from './CriteriaFields.module.scss';

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
              checked={item.type === CriteriaType.Score}
              onChange={() => update(item._key, { type: CriteriaType.Score })}
              title="Баллы"
            />
            <RadioButton
              name={`criteria-type-${item._key}`}
              value={CriteriaType.Multiplier}
              checked={item.type === CriteriaType.Multiplier}
              onChange={() => update(item._key, { type: CriteriaType.Multiplier })}
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
