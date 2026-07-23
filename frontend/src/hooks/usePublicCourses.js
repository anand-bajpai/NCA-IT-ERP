import { useEffect, useState } from "react";
import axios from "axios";
import siteConfig from "../config/siteConfig";
import { coursesData } from "../data/courses";

// Course Enrollment Module — the public Courses page always shows the
// latest courses from the database (added/edited/deleted from the Admin
// Panel show up here immediately). If the API is ever unreachable, we fall
// back to the static catalog so the public website never breaks.
export function usePublicCourses() {
  const [courses, setCourses] = useState(coursesData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    axios
      .get(`${siteConfig.apiBaseUrl}/api/courses`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCourses(res.data.data);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the latest courses.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, loading, error };
}

export default usePublicCourses;
