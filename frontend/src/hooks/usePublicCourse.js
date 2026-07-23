import { useEffect, useState } from "react";
import axios from "axios";
import siteConfig from "../config/siteConfig";
import { coursesData } from "../data/courses";

// Course Enrollment Module — the public Course Detail page always shows the
// latest version of a course from the database. Falls back to the static
// catalog if the API is unreachable, or once the API 404s (course removed),
// so a stale deep link degrades gracefully instead of breaking the page.
export function usePublicCourse(slug) {
  const staticFallback = coursesData.find((c) => c.slug === slug) || null;

  const [course, setCourse] = useState(staticFallback);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    if (!slug) {
      setLoading(false);
      return undefined;
    }

    axios
      .get(`${siteConfig.apiBaseUrl}/api/courses/${slug}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && res.data.data) {
          setCourse(res.data.data);
        } else if (!staticFallback) {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // API unreachable or 404 — keep the static fallback if we have
        // one, otherwise this course genuinely doesn't exist.
        if (!staticFallback) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return { course, loading, notFound };
}

export default usePublicCourse;
