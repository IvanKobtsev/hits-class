import React, { useState, useCallback, DragEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetMappingsQuery,
  useUpdateMappingsMutation,
  useRegenerateMappingsMutation,
  getMappingsQueryKey,
} from 'services/api/api-client/PeerReviewQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { Button, ButtonColor, ButtonWidth } from 'components/uikit/buttons/Button';
import { Loading } from 'components/uikit/suspense/Loading';
import type { PeerReviewMappingDto, UpdatePeerReviewMappingsDto } from 'services/api/api-client.types';
import styles from './PeerReviewMappingsPanel.module.scss';

type Props = {
  publicationId: number;
  courseId: number;
};

export const PeerReviewMappingsPanel = ({ publicationId, courseId }: Props) => {
  const queryClient = useQueryClient();
  const queryKey = getMappingsQueryKey(publicationId);
  const { data: mappings, isLoading } = useGetMappingsQuery(publicationId);
  const { data: course } = useGetCourseQuery(courseId);
  const updateMutation = useUpdateMappingsMutation(publicationId, {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const regenerateMutation = useRegenerateMappingsMutation(publicationId, {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const [dragState, setDragState] = useState<{
    juryUserId: string;
    fromDefendantId: string;
  } | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [addJuryForDefendant, setAddJuryForDefendant] = useState<string | null>(null);

  const saveMappings = useCallback(
    (updated: PeerReviewMappingDto[]) => {
      queryClient.setQueryData(queryKey, updated);

      const dto: UpdatePeerReviewMappingsDto = {
        mappings: updated.map((m: PeerReviewMappingDto) => ({
          defendantUserId: m.defendantUserId,
          juryUserIds: m.juries.map((j) => j.userId),
        })),
      };
      updateMutation.mutate(dto);
    },
    [queryClient, queryKey, updateMutation],
  );

  const handleDragStart = useCallback(
    (e: DragEvent, juryUserId: string, defendantUserId: string) => {
      e.dataTransfer.effectAllowed = 'move';
      setDragState({ juryUserId, fromDefendantId: defendantUserId });
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: DragEvent, defendantUserId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTargetId(defendantUserId);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, toDefendantId: string) => {
      e.preventDefault();
      setDropTargetId(null);
      if (!dragState || !mappings) return;
      if (dragState.fromDefendantId === toDefendantId) return;
      if (dragState.juryUserId === toDefendantId) return;

      const updated = mappings.map((m: PeerReviewMappingDto) => {
        if (m.defendantUserId === dragState.fromDefendantId) {
          return {
            ...m,
            juries: m.juries.filter((j) => j.userId !== dragState.juryUserId),
          };
        }
        if (m.defendantUserId === toDefendantId) {
          if (m.juries.some((j) => j.userId === dragState.juryUserId)) return m;
          const juryInfo = mappings
            .find((mm: PeerReviewMappingDto) => mm.defendantUserId === dragState.fromDefendantId)
            ?.juries.find((j) => j.userId === dragState.juryUserId);
          if (!juryInfo) return m;
          return { ...m, juries: [...m.juries, juryInfo] };
        }
        return m;
      });
      saveMappings(updated);
      setDragState(null);
    },
    [dragState, mappings, saveMappings],
  );

  const handleDragEnd = useCallback(() => {
    setDragState(null);
    setDropTargetId(null);
  }, []);

  const handleRemoveJury = useCallback(
    (defendantUserId: string, juryUserId: string) => {
      if (!mappings) return;
      const updated = mappings.map((m: PeerReviewMappingDto) => {
        if (m.defendantUserId === defendantUserId) {
          return {
            ...m,
            juries: m.juries.filter((j) => j.userId !== juryUserId),
          };
        }
        return m;
      });
      saveMappings(updated);
    },
    [mappings, saveMappings],
  );

  const handleAddJury = useCallback(
    (defendantUserId: string, juryUserId: string, juryName: string) => {
      if (!mappings) return;
      const updated = mappings.map((m: PeerReviewMappingDto) => {
        if (m.defendantUserId === defendantUserId) {
          if (m.juries.some((j) => j.userId === juryUserId)) return m;
          return {
            ...m,
            juries: [...m.juries, { userId: juryUserId, name: juryName }],
          };
        }
        return m;
      });
      saveMappings(updated);
      setAddJuryForDefendant(null);
    },
    [mappings, saveMappings],
  );

  const handleRegenerate = useCallback(() => {
    regenerateMutation.mutate();
  }, [regenerateMutation]);

  if (isLoading) return <Loading loading />;
  if (!mappings || mappings.length === 0) {
    return <div className={styles.empty}>Нет назначений P2P</div>;
  }

  const allStudents = course?.students ?? [];
  const existingJuryIds = (defendantId: string) => {
    const mapping = mappings.find((m: PeerReviewMappingDto) => m.defendantUserId === defendantId);
    return new Set(mapping?.juries.map((j) => j.userId) ?? []);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Назначения жюри</span>
        <Button
          title="Перегенерировать"
          color={ButtonColor.Default}
          width={ButtonWidth.Content}
          onClick={handleRegenerate}
          disabled={regenerateMutation.isPending}
        />
      </div>
      {mappings.map((mapping: PeerReviewMappingDto) => (
        <div
          key={mapping.defendantUserId}
          className={`${styles.defendantCard} ${dropTargetId === mapping.defendantUserId ? styles.dropTarget : ''}`}
          onDragOver={(e) => handleDragOver(e, mapping.defendantUserId)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, mapping.defendantUserId)}
        >
          <div className={styles.defendantName}>{mapping.defendantName}</div>
          <div className={styles.juriesRow}>
            {mapping.juries.map((jury) => (
              <span
                key={jury.userId}
                className={styles.juryChip}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, jury.userId, mapping.defendantUserId)
                }
                onDragEnd={handleDragEnd}
              >
                {jury.name}
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() =>
                    handleRemoveJury(mapping.defendantUserId, jury.userId)
                  }
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              className={styles.addButton}
              onClick={() => setAddJuryForDefendant(mapping.defendantUserId)}
            >
              + Добавить
            </button>
          </div>
        </div>
      ))}

      {addJuryForDefendant && (
        <div
          className={styles.selectOverlay}
          onClick={() => setAddJuryForDefendant(null)}
        >
          <div
            className={styles.selectDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.selectTitle}>Выберите жюри</div>
            {allStudents
              .filter(
                (s) =>
                  s.id !== addJuryForDefendant &&
                  !existingJuryIds(addJuryForDefendant).has(s.id),
              )
              .map((student) => (
                <div
                  key={student.id}
                  className={styles.studentOption}
                  onClick={() =>
                    handleAddJury(
                      addJuryForDefendant,
                      student.id,
                      student.legalName,
                    )
                  }
                >
                  {student.legalName}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
