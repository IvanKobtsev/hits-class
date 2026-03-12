import { Links } from 'application/constants/links';
import { useEffect, useRef, useState } from 'react';
import { useConfirmEmailMutation } from 'services/api/api-client/UserQuery';
import { ProblemDetails } from 'services/api/api-client.types.ts';

export function useEmailConfirmation() {
  const params = Links.Unauthorized.ConfirmEmail.useParams();
  const mutation = useConfirmEmailMutation(params.userId, {
    onError: (error) => {
      toast.error(error as ProblemDetails);
    },
    onSuccess: (data) => {
      setState('success');
    },
  });
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (!hasCalledRef.current) {
      hasCalledRef.current = true;
      mutation.mutate();
    }
  }, []);
}
