/**
 * This method is a substitute for `useNavigate()` when
 * we don't have the router context available.<br>
 * <b>Warning:</b> Reloads the page.
 */
export function browserNavigate(link: string) {
  window.location.assign(link);
}

/**
 * Acts as if user themselves would click
 * on "Go Back" arrow in the browser.
 */
export function navigateBack() {
  window.history.back();
}
