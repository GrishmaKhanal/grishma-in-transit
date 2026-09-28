/** +/− indicator that flips when its parent <details class="group"> opens. */
export function Sign() {
  return (
    <>
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">−</span>
    </>
  );
}
