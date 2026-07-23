import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router does NOT reset scroll position on navigation by default.
 * This mounts once at the app root and scrolls the window to the top
 * every time the route (pathname) changes, so clicking any navbar link
 * always lands the user at the top of the new page.
 *
 * If the URL includes a hash (e.g. /services#ai-solutions from the
 * Services dropdown), it scrolls to that section instead of the top.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait a tick for the target page to render before scrolling to it
      const id = hash.replace("#", "");
      const scrollToHash = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
      };
      const timer = setTimeout(scrollToHash, 80);
      return () => clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
