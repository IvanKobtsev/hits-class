import { useNavigate } from 'react-router-dom';

/**
 * This method will call `window.location.assign()` as a substitute<br>
 * for `useNavigate()` when we don't have the router context available.<br>
 * The only difference is that in that case the browser will reload the page.
 */
export function useNavigateWithFallback() {
  try {
    const navigate = useNavigate();
    return async (link: string) => {
      await navigate(link);
    };
  } catch (error) {
    return (link: string) => {
      window.location.assign(link);
    };
  }
}

/**
 * Acts as if user themselves would click
 * on "Go Back" arrow in the browser.
 */
export function navigateBack() {
  window.history.back();
}
