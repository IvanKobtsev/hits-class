import { useState } from 'react';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { Button, ButtonColor, ButtonWidth } from 'components/uikit/buttons/Button';
import { FormError } from 'components/uikit/FormError';
import { Loading } from 'components/uikit/suspense/Loading';
import { useJoinCourseMutation } from 'services/api/api-client/CourseQuery';
import styles from './JoinCourseModal.module.scss';

export type JoinCourseModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const JoinCourseModal = ({ isOpen, onClose }: JoinCourseModalProps) => {
  const [inviteCode, setInviteCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [overallError, setOverallError] = useState('');

  const { mutateAsync, isPending } = useJoinCourseMutation(inviteCode);

  const handleClose = () => {
    setInviteCode('');
    setFieldError('');
    setOverallError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      setFieldError('Обязательное поле');
      return;
    }

    setFieldError('');
    setOverallError('');

    try {
      await mutateAsync();
      setInviteCode('');
      onClose();
    } catch {
      setOverallError('Не удалось присоединиться к курсу');
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      isBlocking={false}
      title="Записаться на курс"
    >
      <Loading loading={isPending}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Field title="Код приглашения:">
            <Input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              errorText={fieldError}
              testId="JoinCourse-inviteCode"
            />
          </Field>
          <FormError>{overallError || null}</FormError>
          <div className={styles.footer}>
            <Button
              title="Записаться"
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
