import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import {
  Button,
  ButtonColor,
  ButtonWidth,
} from 'components/uikit/buttons/Button';
import { FormError } from 'components/uikit/FormError';
import { Loading } from 'components/uikit/suspense/Loading';
import { useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import {
  useCreateCourseMutation,
  getCoursesQueryKey,
} from 'services/api/api-client/CourseQuery';
import styles from './CreateCourseModal.module.scss';

type CreateCourseForm = {
  title: string;
  description: string;
};

export type CreateCourseModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateCourseModal = ({
  isOpen,
  onClose,
}: CreateCourseModalProps) => {
  const { mutateAsync, isPending } = useCreateCourseMutation();
  const queryClient = useQueryClient();

  const form = useAdvancedForm<CreateCourseForm>(
    async (data) => {
      await mutateAsync({ title: data.title, description: data.description });
      await queryClient.invalidateQueries({ queryKey: [] }); // TODO: specify query key
      onClose();
    },
    { shouldResetOnSuccess: true },
  );

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      isBlocking={false}
      title="Создать курс"
    >
      <Loading loading={isPending}>
        <form onSubmit={form.handleSubmitDefault} className={styles.form}>
          <Field title="Название">
            <Input
              {...form.register('title', { ...requiredRule() })}
              errorText={form.formState.errors.title?.message}
              testId="CreateCourse-title"
            />
          </Field>
          <Field title="Описание">
            <Input
              {...form.register('description', { ...requiredRule() })}
              errorText={form.formState.errors.description?.message}
              testId="CreateCourse-description"
            />
          </Field>
          <FormError>{form.overallError || null}</FormError>
          <div className={styles.footer}>
            <Button
              title="Создать"
              type="submit"
              color={ButtonColor.Primary}
              width={ButtonWidth.Fullwidth}
            />
          </div>
        </form>
      </Loading>
    </CustomModal>
  );
};
