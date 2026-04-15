import clsx from 'clsx';
import React, { RefObject } from 'react';
import styles from './Loading.module.scss';

import animationData from 'assets/animations/9629-loading.json';
import { Lottie } from '../../animations/Lottie';
import { errorToString } from 'helpers/error-helpers';

type Props = {
  loading: boolean;
  title?: string;
  testId?: string;
  loadingTestId?: string;
  children?: React.ReactNode;
  className?: string;
  flex?: boolean;
  error?: any;
  wrapperClassName?: string;
  dataLoadedClassName?: string;
  centerContent?: boolean;
  doNotRenderChildrenWhileLoading?: boolean;
  doNotWrapChildren?: boolean;
  wrapperStyle?: React.CSSProperties;
  ref?: RefObject<HTMLDivElement | null>;
};

export const Loading: React.FC<Props> = (props) => {
  const loadingStyles = [props.className];
  loadingStyles.push(styles.loadingContainer);

  const loading = (
    <div className={styles.loading}>
      <div className={styles.row}>
        <Lottie animationData={animationData} className={styles.lottie} />
        {props.title && <div className={styles.title}> {props.title}</div>}
      </div>
    </div>
  );
  const children = (
    props.loading &&
    props.doNotRenderChildrenWhileLoading ? null : props.error ? (
      <h1 className={styles.loading} data-test-id="loading-error">
        {errorToString(props.error)}
      </h1>
    ) : (
      props.children
    )
  ) as React.ReactNode;

  return props.doNotWrapChildren ? (
    props.loading ? (
      loading
    ) : (
      children
    )
  ) : (
    <div
      className={clsx(
        props.flex ? styles.flexContainer : styles.container,
        props.centerContent !== false ? styles.centerContent : null,
        props.wrapperClassName,
      )}
      style={props.wrapperStyle}
      data-test-id={props.testId}
    >
      <div
        data-loading={props.loading}
        className={clsx(
          props.flex ? styles.flexLoadingData : styles.loadingData,
          props.dataLoadedClassName,
        )}
        ref={props.ref}
      >
        {children}
      </div>
      {props.loading && !props.error && (
        <div
          className={clsx(loadingStyles)}
          data-test-id={props.loadingTestId ?? 'loading'}
        >
          {loading}
        </div>
      )}
    </div>
  );
};
