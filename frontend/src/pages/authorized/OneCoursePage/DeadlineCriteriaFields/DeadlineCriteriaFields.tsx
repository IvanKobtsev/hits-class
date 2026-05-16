import { Control, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { CheckBox } from 'components/uikit/CheckBox';
import { RadioButton } from 'components/uikit/RadioButton';
import { HookFormDatePicker } from 'components/uikit/inputs/date-time/HookFormDatePicker';
import { BonusType } from 'services/api/api-client.types';
import styles from './DeadlineCriteriaFields.module.scss';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>;
  deadlineSet: boolean;
}

export const DeadlineCriteriaFields = ({
  register,
  control,
  watch,
  deadlineSet,
}: Props) => {
  const hasEarlyBonus = watch('hasEarlyBonus');
  const hasLatePenalty = watch('hasLatePenalty');

  if (!deadlineSet) return null;

  return (
    <div className={styles.section}>
      <Field title="Бонус за раннюю сдачу">
        <CheckBox
          {...register('hasEarlyBonus')}
          title="Добавить бонус"
        />
      </Field>

      {hasEarlyBonus && (
        <>
          <Field title="Самый ранний срок сдачи">
            <HookFormDatePicker
              name="earlyBonusEarliestDate"
              control={control}
              withTime
            />
          </Field>
          <Field title="Величина бонуса">
            <Input {...register('earlyBonusValue')} />
          </Field>
          <Field title="Тип бонуса" fieldClassName={styles.radioGroup}>
            <RadioButton
              {...register('earlyBonusType')}
              value={BonusType.Score}
              title="Баллы"
            />
            <RadioButton
              {...register('earlyBonusType')}
              value={BonusType.Multiplier}
              title="Коэффициент"
            />
          </Field>
        </>
      )}

      <Field title="Штраф за опоздание">
        <CheckBox
          {...register('hasLatePenalty')}
          title="Добавить штраф"
        />
      </Field>

      {hasLatePenalty && (
        <Field title="Последний срок сдачи">
          <HookFormDatePicker
            name="latePenaltyLatestDate"
            control={control}
            withTime
          />
        </Field>
      )}
    </div>
  );
};
