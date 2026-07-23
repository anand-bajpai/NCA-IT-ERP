import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Renders a row's "..." action menu into a portal at document.body,
 * positioned with `position: fixed` next to the trigger button (anchorRef).
 *
 * Why this exists: the tables it's used in live inside a scrollable
 * `*-table-wrap` (overflow-x: auto), which clips any absolutely-positioned
 * child that would otherwise float outside the row. Portaling the menu to
 * <body> and computing its screen position manually escapes that clipping,
 * so the menu always renders fully visible above the table — and flips
 * upward automatically when there isn't enough room below the trigger
 * (e.g. for rows near the bottom of the page).
 */
const RowMenuPortal = ({ anchorRef, open, onClose, children, className = "" }) => {
  const menuRef = useRef(null);
  const [coords, setCoords] = useState(null);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    const anchor = anchorRef.current;
    if (!anchor) return;

    const compute = () => {
      const rect = anchor.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight || 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight + 12 && rect.top > menuHeight;
      setCoords({
        top: openUpward ? null : rect.bottom + 6,
        bottom: openUpward ? window.innerHeight - rect.top + 6 : null,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    compute();
    // Recompute once more after the menu has actually rendered/measured itself
    const raf = requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e) => {
      const clickedAnchor = anchorRef.current && anchorRef.current.contains(e.target);
      const clickedMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!clickedAnchor && !clickedMenu) onClose();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={`row-menu-dropdown row-menu-dropdown--portal ${className}`}
      role="menu"
      style={{
        position: "fixed",
        top: coords?.top ?? -9999,
        bottom: coords?.bottom ?? "auto",
        right: coords?.right ?? -9999,
        visibility: coords ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default RowMenuPortal;
