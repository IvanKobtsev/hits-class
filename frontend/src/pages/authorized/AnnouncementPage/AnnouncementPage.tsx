import { useParams } from 'react-router';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { PublicCommentView } from 'pages/authorized/AssignmentPage/PublicCommentView/PublicCommentView';
import { LexicalViewer } from 'components/lexical/LexicalViewer';
import { AttachmentsList } from 'pages/authorized/OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList';
import AnnouncementIcon from 'assets/icons/announcement.svg?react';
import styles from './AnnouncementPage.module.scss';

function formatDateUTC(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}.${m}.${y}`;
}

export const AnnouncementPage = () => {
  const { announcementId } = useParams();
  const id = Number(announcementId);

  const { data: publication } = useGetPublicationByIdQuery(id);

  if (!publication) return null;

  const {
    content,
    author,
    createdAtUTC: createdAtUTCRaw,
    attachments,
  } = publication;
  const createdAtUTC = new Date(createdAtUTCRaw);

  return (
    <div className={styles.page} data-test-id="AnnouncementPage">
      <div className={styles.layout}>
        <div className={styles.container}>
          <div className={styles.banner}>
            <div className={styles.bannerTop}>
              <div className={styles.iconWrapper}>
                <AnnouncementIcon />
              </div>
              <div className={styles.meta}>
                <span className={styles.metaItem}>
                  <span className={styles.metaLabel}>Автор:</span>
                  <span className={styles.metaValue}>{author.legalName}</span>
                </span>
                <span className={styles.metaItem}>
                  <span className={styles.metaLabel}>Опубликовано:</span>
                  <span className={styles.metaValue}>
                    {formatDateUTC(createdAtUTC)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {(content != null ||
            (attachments != null && attachments.length > 0)) && (
            <div className={styles.body}>
              {content != null && (
                <div className={styles.description}>
                  <LexicalViewer lexicalState={content} />
                </div>
              )}
              {attachments != null && attachments.length > 0 && (
                <AttachmentsList
                  attachments={attachments}
                  onError={(error) =>
                    console.error('File download error:', error)
                  }
                />
              )}
            </div>
          )}
        </div>

        <PublicCommentView publicationId={id} />
      </div>
    </div>
  );
};
